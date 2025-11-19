"""
Repositório de Resgates de Recompensa
Gerencia operações de persistência para histórico de resgates
"""
from typing import Optional, Dict, Any, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection

from src.infra.database.config.database import get_database


def _collection() -> AsyncIOMotorCollection:
    """Retorna a collection de resgates do MongoDB"""
    return get_database()["resgates"]


def _to_response(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Converte documento do MongoDB para formato de resposta.
    Serializa ObjectId para string e adiciona campo 'id' para compatibilidade com Pydantic.
    """
    if not doc:
        return None
    _id = doc.get("_id")
    id_str = str(_id) if isinstance(_id, ObjectId) else _id
    return {**doc, "_id": id_str, "id": id_str}


def _to_response_many(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Converte múltiplos documentos para formato de resposta"""
    return [_to_response(d) for d in docs if d]


async def criar_resgate(doc: Dict[str, Any]) -> str:
    """
    Cria registro de resgate no banco.
    
    Args:
        doc: Documento com recompensa_id, produtor_id, pontos_gastos, data_resgate
    
    Returns:
        ID do resgate criado
    """
    result = await _collection().insert_one(doc)
    return str(result.inserted_id)


async def listar_por_produtor(
    produtor_id: str,
    *,
    limit: int = 100,
    skip: int = 0
) -> List[Dict[str, Any]]:
    """
    Lista histórico de resgates de um produtor específico.
    
    Args:
        produtor_id: ID do produtor
        limit: Máximo de registros a retornar
        skip: Quantos registros pular (paginação)
    
    Returns:
        Lista de resgates ordenados por data (mais recente primeiro)
    """
    cursor = _collection().find(
        {"produtor_id": produtor_id}
    ).sort("data_resgate", -1).skip(skip).limit(limit)
    
    docs = await cursor.to_list(length=limit)
    return _to_response_many(docs)
