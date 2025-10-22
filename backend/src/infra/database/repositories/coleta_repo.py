from typing import Optional, Dict, Any, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection

from src.infra.database.config.database import get_database


def _collection() -> AsyncIOMotorCollection:
    return get_database()["coletas"]


def _to_response(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    _id = doc.get("_id")
    id_str = str(_id) if isinstance(_id, ObjectId) else _id
    return {**doc, "_id": id_str, "id": id_str}


def _to_response_many(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [d for d in map(_to_response, docs) if d is not None]


async def create_coleta(doc: Dict[str, Any]) -> str:
    """
    Cria uma nova coleta.

    Espera um documento compatível com o model Coleta, contendo:
    - agendamento_id: str
    - produtor_id: str
    - coletor_id: str
    - resíduos_id: list[str]
    - data_hora_inicio: datetime
    - data_hora_fim: Optional[datetime]
    - local: str
    - observacoes: Optional[str]
    - estado: str (PENDENTE, EM_ANDAMENTO, CONCLUIDA, CANCELADA)
    """
    result = await _collection().insert_one(doc)
    return str(result.inserted_id)


async def find_by_id(coleta_id: str) -> Optional[Dict[str, Any]]:
    try:
        _id = ObjectId(coleta_id)
    except Exception:
        return None
    doc = await _collection().find_one({"_id": _id})
    return _to_response(doc)


async def list_coletas(*, filters: Optional[Dict[str, Any]] = None, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
    query = filters or {}
    cursor = _collection().find(query).skip(skip).limit(limit).sort("data_hora_inicio", -1)
    docs = await cursor.to_list(length=limit)
    return _to_response_many(docs)


async def find_by_produtor_id(produtor_id: str, *, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
    cursor = _collection().find({"produtor_id": produtor_id}).skip(skip).limit(limit).sort("data_hora_inicio", -1)
    docs = await cursor.to_list(length=limit)
    return _to_response_many(docs)


async def find_by_coletor_id(coletor_id: str, *, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
    cursor = _collection().find({"coletor_id": coletor_id}).skip(skip).limit(limit).sort("data_hora_inicio", -1)
    docs = await cursor.to_list(length=limit)
    return _to_response_many(docs)


async def find_by_agendamento_id(agendamento_id: str, *, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
    cursor = _collection().find({"agendamento_id": agendamento_id}).skip(skip).limit(limit).sort("data_hora_inicio", -1)
    docs = await cursor.to_list(length=limit)
    return _to_response_many(docs)


async def update_coleta(coleta_id: str, updates: Dict[str, Any]) -> bool:
    try:
        _id = ObjectId(coleta_id)
    except Exception:
        return False
    if not updates:
        return True
    # Evitar atualização de campos imutáveis
    updates = {k: v for k, v in updates.items() if k not in {"_id", "id"}}
    result = await _collection().update_one({"_id": _id}, {"$set": updates})
    return result.matched_count > 0


async def update_estado(coleta_id: str, novo_estado: str) -> bool:
    """Atualiza apenas o estado da coleta."""
    try:
        _id = ObjectId(coleta_id)
    except Exception:
        return False
    result = await _collection().update_one({"_id": _id}, {"$set": {"estado": novo_estado}})
    return result.matched_count > 0


async def delete_coleta(coleta_id: str) -> bool:
    try:
        _id = ObjectId(coleta_id)
    except Exception:
        return False
    result = await _collection().delete_one({"_id": _id})
    return result.deleted_count > 0
