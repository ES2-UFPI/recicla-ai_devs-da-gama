from typing import Optional, Dict, Any, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection

from src.infra.database.config.database import get_database


def _collection() -> AsyncIOMotorCollection:
    # Segue o padrão do user_repo usando nome em inglês
    return get_database()["residues"]


def _to_response(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    _id = doc.get("_id")
    return {**doc, "_id": str(_id) if isinstance(_id, ObjectId) else _id}


def _to_response_many(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [d for d in map(_to_response, docs) if d is not None]


async def create_residue(doc: Dict[str, Any]) -> str:
    result = await _collection().insert_one(doc)
    return str(result.inserted_id)


async def find_by_id(residue_id: str) -> Optional[Dict[str, Any]]:
    try:
        _id = ObjectId(residue_id)
    except Exception:
        return None
    doc = await _collection().find_one({"_id": _id})
    return _to_response(doc)


async def find_by_produtor_id(produtor_id: str, *, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
    cursor = _collection().find({"produtorId": produtor_id}).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return _to_response_many(docs)


async def find_by_categoria_id(categoria_id: str, *, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
    cursor = _collection().find({"categoriaId": categoria_id}).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return _to_response_many(docs)


async def list_residues(*, filters: Optional[Dict[str, Any]] = None, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
    query = filters or {}
    cursor = _collection().find(query).skip(skip).limit(limit).sort("dataCadastro", -1)
    docs = await cursor.to_list(length=limit)
    return _to_response_many(docs)


async def update_residue(residue_id: str, updates: Dict[str, Any]) -> bool:
    try:
        _id = ObjectId(residue_id)
    except Exception:
        return False
    if not updates:
        return True
    result = await _collection().update_one({"_id": _id}, {"$set": updates})
    return result.matched_count > 0


async def delete_residue(residue_id: str) -> bool:
    try:
        _id = ObjectId(residue_id)
    except Exception:
        return False
    result = await _collection().delete_one({"_id": _id})
    return result.deleted_count > 0
