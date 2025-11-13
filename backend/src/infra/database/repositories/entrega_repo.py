from typing import Optional, Dict, Any, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection

from src.infra.database.config.database import get_database


def _collection() -> AsyncIOMotorCollection:
    """Retorna a coleção de entregas do MongoDB"""
    return get_database()["entregas"]


def _to_response(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Converte documento do MongoDB para formato de resposta.
    Garante que _id seja string e adiciona campo 'id' para compatibilidade.
    """
    if not doc:
        return None
    _id = doc.get("_id")
    id_str = str(_id) if isinstance(_id, ObjectId) else _id
    # Retorna ambos '_id' e 'id' para compatibilidade
    return {**doc, "_id": id_str, "id": id_str}


async def create_entrega(doc: Dict[str, Any]) -> str:
    """
    Cria uma nova entrega no banco de dados.
    
    Args:
        doc: Documento da entrega a ser criada
        
    Returns:
        str: ID da entrega criada
    """
    result = await _collection().insert_one(doc)
    return str(result.inserted_id)


async def find_by_id(entrega_id: str) -> Optional[Dict[str, Any]]:
    """
    Busca uma entrega por ID.
    
    Args:
        entrega_id: ID da entrega
        
    Returns:
        Dict ou None: Dados da entrega ou None se não encontrada
    """
    try:
        _id = ObjectId(entrega_id)
    except Exception:
        return None
    doc = await _collection().find_one({"_id": _id})
    return _to_response(doc)


async def find_by_coletor_id(coletor_id: str, *, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
    """
    Busca entregas por ID do coletor.
    
    Args:
        coletor_id: ID do coletor
        limit: Limite de resultados (padrão: 100)
        skip: Número de resultados para pular (padrão: 0)
        
    Returns:
        List[Dict]: Lista de entregas do coletor, ordenadas por data_hora (mais recente primeiro)
    """
    cursor = _collection().find({"coletor_id": coletor_id}).skip(skip).limit(limit).sort("data_hora", -1)
    docs = await cursor.to_list(length=limit)
    return [d for d in (_to_response(doc) for doc in docs) if d is not None]


async def find_by_receptora_id(receptora_id: str, *, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
    """
    Busca entregas por ID da receptora.
    
    Args:
        receptora_id: ID da receptora (ecoponto)
        limit: Limite de resultados (padrão: 100)
        skip: Número de resultados para pular (padrão: 0)
        
    Returns:
        List[Dict]: Lista de entregas recebidas pela receptora, ordenadas por data_hora (mais recente primeiro)
    """
    cursor = _collection().find({"receptora_id": receptora_id}).skip(skip).limit(limit).sort("data_hora", -1)
    docs = await cursor.to_list(length=limit)
    return [d for d in (_to_response(doc) for doc in docs) if d is not None]