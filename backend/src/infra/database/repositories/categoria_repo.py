from typing import Optional, Dict, Any, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection

from src.infra.database.config.database import get_database


def _collection() -> AsyncIOMotorCollection:
    """Retorna a collection de categorias do MongoDB"""
    return get_database()["categorias"]


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


async def listar_categorias_ativas() -> List[Dict[str, Any]]:
    """
    Lista todas as categorias ativas ordenadas por tipo.
    
    Returns:
        List[Dict]: Lista de categorias ativas
    """
    cursor = _collection().find({"ativo": True}).sort("tipo", 1)
    docs = await cursor.to_list(length=100)
    return _to_response_many(docs)


async def listar_todas_categorias() -> List[Dict[str, Any]]:
    """
    Lista todas as categorias (ativas e inativas).
    
    Returns:
        List[Dict]: Lista de todas as categorias
    """
    cursor = _collection().find({}).sort("tipo", 1)
    docs = await cursor.to_list(length=100)
    return _to_response_many(docs)


async def buscar_por_id(categoria_id: str) -> Optional[Dict[str, Any]]:
    """
    Busca categoria por ID.
    
    Args:
        categoria_id: ID da categoria
        
    Returns:
        Optional[Dict]: Categoria encontrada ou None
    """
    try:
        _id = ObjectId(categoria_id)
    except Exception:
        return None
    doc = await _collection().find_one({"_id": _id})
    return _to_response(doc)


async def buscar_por_tipo(tipo: str) -> Optional[Dict[str, Any]]:
    """
    Busca categoria ativa por tipo (ex: 'Plástico').
    
    Args:
        tipo: Nome do tipo da categoria
        
    Returns:
        Optional[Dict]: Categoria encontrada ou None
    """
    doc = await _collection().find_one({"tipo": tipo, "ativo": True})
    return _to_response(doc)


async def criar_categoria(doc: Dict[str, Any]) -> str:
    """
    Cria nova categoria.
    
    Args:
        doc: Documento da categoria
        
    Returns:
        str: ID da categoria criada
    """
    result = await _collection().insert_one(doc)
    return str(result.inserted_id)


async def atualizar_categoria(categoria_id: str, updates: Dict[str, Any]) -> bool:
    """
    Atualiza campos de uma categoria.
    
    Args:
        categoria_id: ID da categoria
        updates: Campos a atualizar
        
    Returns:
        bool: True se atualizou com sucesso
    """
    try:
        _id = ObjectId(categoria_id)
    except Exception:
        return False
    if not updates:
        return True
    result = await _collection().update_one({"_id": _id}, {"$set": updates})
    return result.matched_count > 0


async def atualizar_preco(categoria_id: str, novo_preco: float) -> bool:
    """
    Atualiza apenas o preço por kg da categoria.
    
    Args:
        categoria_id: ID da categoria
        novo_preco: Novo preço por kg
        
    Returns:
        bool: True se atualizou com sucesso
    """
    try:
        _id = ObjectId(categoria_id)
    except Exception:
        return False
    result = await _collection().update_one(
        {"_id": _id},
        {"$set": {"preco_por_kg": novo_preco}}
    )
    return result.matched_count > 0


async def desativar_categoria(categoria_id: str) -> bool:
    """
    Desativa uma categoria (soft delete).
    Não remove do banco, apenas marca como inativa.
    
    Args:
        categoria_id: ID da categoria
        
    Returns:
        bool: True se desativou com sucesso
    """
    try:
        _id = ObjectId(categoria_id)
    except Exception:
        return False
    result = await _collection().update_one(
        {"_id": _id},
        {"$set": {"ativo": False}}
    )
    return result.matched_count > 0


async def reativar_categoria(categoria_id: str) -> bool:
    """
    Reativa uma categoria desativada.
    
    Args:
        categoria_id: ID da categoria
        
    Returns:
        bool: True se reativou com sucesso
    """
    try:
        _id = ObjectId(categoria_id)
    except Exception:
        return False
    result = await _collection().update_one(
        {"_id": _id},
        {"$set": {"ativo": True}}
    )
    return result.matched_count > 0
