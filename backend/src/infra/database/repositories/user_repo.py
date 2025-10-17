from typing import Optional, Dict, Any, List
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



def _to_object_id(user_id: str) -> Optional[ObjectId]:
	try:
		return ObjectId(user_id)
	except Exception:
		return None


async def find_by_phone(phone: str) -> Optional[Dict[str, Any]]:
	doc = await _collection().find_one({"phone": phone})
	return _to_response(doc)


async def update_user(user_id: str, updates: Dict[str, Any]) -> bool:
	"""Atualização genérica. Aceita campos como name, email, phone, password_hash, role_id, addresses, cidade_id, estado_id."""
	_id = _to_object_id(user_id)
	if not _id:
		return False

	# Prevent updating immutable fields
	updates = {k: v for k, v in updates.items() if k not in {"_id", "id"}}
	if not updates:
		return False

	result = await _collection().update_one({"_id": _id}, {"$set": updates})
	return result.matched_count > 0


async def get_addresses(user_id: str) -> Optional[List[Dict[str, Any]]]:
	"""Retorna uma lista de endereços para o usuário"""
	_id = _to_object_id(user_id)
	if not _id:
		return None
	doc = await _collection().find_one({"_id": _id}, {"addresses": 1})
	if not doc:
		return None
	return doc.get("addresses", []) or []


async def add_address(user_id: str, address: Dict[str, Any]) -> bool:
	"""Adiciona um novo endereço ao array de endereços do usuário com ID incremental"""
	_id = _to_object_id(user_id)
	if not _id:
		return False
	
	# Buscar o usuário para determinar o próximo ID
	user = await _collection().find_one({"_id": _id}, {"addresses": 1})
	if not user:
		return False
	
	# Calcular o próximo ID incremental
	existing_addresses = user.get("addresses", [])
	next_id = 1
	if existing_addresses:
		max_id = max([addr.get("id", 0) for addr in existing_addresses], default=0)
		next_id = max_id + 1
	
	# Adicionar o ID ao endereço
	address["id"] = next_id
	
	# Adicionar o endereço ao array
	result = await _collection().update_one(
		{"_id": _id},
		{"$push": {"addresses": address}}
	)
	return result.matched_count > 0


async def update_address(user_id: str, address_id: int, updates: Dict[str, Any]) -> bool:
	"""
	Atualiza um endereço pelo seu ID
	Apenas os campos fornecidos serão atualizados
	"""
	_id = _to_object_id(user_id)
	if not _id:
		return False

	if not updates:
		return False

	# Build $set for the positional operator
	set_updates: Dict[str, Any] = {}
	for k, v in updates.items():
		if k in {"apelido", "cep", "logradouro", "numero", "latitude", "longitude", "complemento"}:
			set_updates[f"addresses.$.{k}"] = v

	if not set_updates:
		return False

	result = await _collection().update_one(
		{"_id": _id, "addresses.id": address_id},
		{"$set": set_updates}
	)
	return result.matched_count > 0 and result.modified_count > 0


async def remove_address(user_id: str, address_id: int) -> bool:
	"""Remove um endereço de um usuário, pelo seu ID"""
	_id = _to_object_id(user_id)
	if not _id:
		return False
	result = await _collection().update_one(
		{"_id": _id},
		{"$pull": {"addresses": {"id": address_id}}}
	)
	return result.matched_count > 0 and result.modified_count > 0
