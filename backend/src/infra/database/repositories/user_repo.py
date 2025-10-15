from typing import Optional, Dict, Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection

from src.infra.database.config.database import get_database


def _collection() -> AsyncIOMotorCollection:
	return get_database()["users"]


def _to_response(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
	if not doc:
		return None
	# Ensure _id is a string for JSON serialization / response models
	_id = doc.get("_id")
	id_str = str(_id) if isinstance(_id, ObjectId) else _id
	# Retorna ambos '_id' e 'id' para compatibilidade
	return {**doc, "_id": id_str, "id": id_str}


async def find_by_email(email: str) -> Optional[Dict[str, Any]]:
	doc = await _collection().find_one({"email": email})
	return _to_response(doc)


async def create_user(doc: Dict[str, Any]) -> str:
	result = await _collection().insert_one(doc)
	return str(result.inserted_id)


async def find_by_id(user_id: str) -> Optional[Dict[str, Any]]:
	try:
		_id = ObjectId(user_id)
	except Exception:
		return None
	doc = await _collection().find_one({"_id": _id})
	return _to_response(doc)
