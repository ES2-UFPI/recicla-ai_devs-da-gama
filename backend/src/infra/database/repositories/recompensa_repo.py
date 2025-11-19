"""
Repositório de Recompensas
Gerencia operações de CRUD para recompensas do sistema de gamificação
"""
from typing import Optional, Dict, Any, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection

from src.infra.database.config.database import get_database


def _collection() -> AsyncIOMotorCollection:
    """Retorna a collection de recompensas do MongoDB"""
    return get_database()["recompensas"]


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
    return [d for d in map(_to_response, docs) if d is not None]


def _to_object_id(id_str: str) -> Optional[ObjectId]:
    """Converte string para ObjectId. Retorna None se inválido."""
    try:
        return ObjectId(id_str)
    except Exception:
        return None


async def criar_recompensa(doc: Dict[str, Any]) -> str:
    """
    Cria nova recompensa.
    
    Args:
        doc: Documento da recompensa
        
    Returns:
        str: ID da recompensa criada
    """
    result = await _collection().insert_one(doc)
    return str(result.inserted_id)


async def buscar_por_id(recompensa_id: str) -> Optional[Dict[str, Any]]:
    """
    Busca recompensa por ID.
    
    Args:
        recompensa_id: ID da recompensa
        
    Returns:
        Optional[Dict]: Recompensa encontrada ou None
    """
    _id = _to_object_id(recompensa_id)
    if not _id:
        return None
    doc = await _collection().find_one({"_id": _id})
    return _to_response(doc)


async def listar_recompensas_ativas(
    *, 
    limit: int = 100, 
    skip: int = 0,
    com_estoque: bool = False
) -> List[Dict[str, Any]]:
    """
    Lista todas as recompensas ativas ordenadas por pontos necessários.
    
    Args:
        limit: Quantidade máxima de resultados
        skip: Quantidade de registros a pular (paginação)
        com_estoque: Se True, retorna apenas recompensas com estoque > 0
        
    Returns:
        List[Dict]: Lista de recompensas ativas
    """
    query = {"ativo": True}
    if com_estoque:
        query["estoque"] = {"$gt": 0}
    
    cursor = _collection().find(query).skip(skip).limit(limit).sort("pontos_necessarios", 1)
    docs = await cursor.to_list(length=limit)
    return _to_response_many(docs)


async def listar_todas_recompensas(
    *, 
    limit: int = 100, 
    skip: int = 0
) -> List[Dict[str, Any]]:
    """
    Lista todas as recompensas (ativas e inativas).
    
    Args:
        limit: Quantidade máxima de resultados
        skip: Quantidade de registros a pular (paginação)
        
    Returns:
        List[Dict]: Lista de todas as recompensas
    """
    cursor = _collection().find({}).skip(skip).limit(limit).sort("pontos_necessarios", 1)
    docs = await cursor.to_list(length=limit)
    return _to_response_many(docs)


async def atualizar_recompensa(recompensa_id: str, updates: Dict[str, Any]) -> bool:
    """
    Atualiza campos de uma recompensa.
    
    Args:
        recompensa_id: ID da recompensa
        updates: Campos a atualizar
        
    Returns:
        bool: True se atualizou com sucesso
    """
    _id = _to_object_id(recompensa_id)
    if not _id:
        return False
    if not updates:
        return True
    result = await _collection().update_one({"_id": _id}, {"$set": updates})
    return result.matched_count > 0


async def atualizar_estoque(recompensa_id: str, quantidade: int) -> bool:
    """
    Atualiza o estoque de uma recompensa (incremento ou decremento).
    
    Args:
        recompensa_id: ID da recompensa
        quantidade: Quantidade a adicionar (positivo) ou remover (negativo)
        
    Returns:
        bool: True se atualizou com sucesso
    """
    _id = _to_object_id(recompensa_id)
    if not _id:
        return False
    
    result = await _collection().update_one(
        {"_id": _id},
        {"$inc": {"estoque": quantidade}}
    )
    return result.matched_count > 0


async def decrementar_estoque(recompensa_id: str, quantidade: int = 1) -> bool:
    """
    Decrementa o estoque de uma recompensa após resgate.
    Valida que há estoque suficiente antes de decrementar.
    
    Args:
        recompensa_id: ID da recompensa
        quantidade: Quantidade a decrementar (padrão: 1)
        
    Returns:
        bool: True se decrementou com sucesso, False se não há estoque
    """
    _id = _to_object_id(recompensa_id)
    if not _id:
        return False
    
    # Atualiza apenas se houver estoque suficiente
    result = await _collection().update_one(
        {"_id": _id, "estoque": {"$gte": quantidade}},
        {"$inc": {"estoque": -quantidade}}
    )
    return result.matched_count > 0


async def ativar_recompensa(recompensa_id: str) -> bool:
    """
    Ativa uma recompensa.
    
    Args:
        recompensa_id: ID da recompensa
        
    Returns:
        bool: True se ativou com sucesso
    """
    _id = _to_object_id(recompensa_id)
    if not _id:
        return False
    result = await _collection().update_one(
        {"_id": _id},
        {"$set": {"ativo": True}}
    )
    return result.matched_count > 0


async def desativar_recompensa(recompensa_id: str) -> bool:
    """
    Desativa uma recompensa (soft delete).
    Não remove do banco, apenas marca como inativa.
    
    Args:
        recompensa_id: ID da recompensa
        
    Returns:
        bool: True se desativou com sucesso
    """
    _id = _to_object_id(recompensa_id)
    if not _id:
        return False
    result = await _collection().update_one(
        {"_id": _id},
        {"$set": {"ativo": False}}
    )
    return result.matched_count > 0


async def deletar_recompensa(recompensa_id: str) -> bool:
    """
    Deleta permanentemente uma recompensa do banco.
    ⚠️ Use com cuidado! Prefer desativar_recompensa() para soft delete.
    
    Args:
        recompensa_id: ID da recompensa
        
    Returns:
        bool: True se deletou com sucesso
    """
    _id = _to_object_id(recompensa_id)
    if not _id:
        return False
    result = await _collection().delete_one({"_id": _id})
    return result.deleted_count > 0
