from typing import Optional, Dict, Any, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection

from src.infra.database.config.database import get_database


def _collection() -> AsyncIOMotorCollection:
	return get_database()["schedules"]


def _to_response(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
	if not doc:
		return None
	_id = doc.get("_id")
	id_str = str(_id) if isinstance(_id, ObjectId) else _id
	return {**doc, "_id": id_str, "id": id_str}


def _to_response_many(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
	return [d for d in map(_to_response, docs) if d is not None]


async def create_scheduling(doc: Dict[str, Any]) -> str:
	"""Cria um novo agendamento.

	Espera um documento compatível com o model Scheduling, contendo:
	- produtorId: str
	- residuosId: list[str]
	- disponibilidade: list[dict] (lista de slots com data, hora_inicio, hora_fim)
	- local: dict (objeto com address_id, cep, logradouro, numero, etc)
	- status: str (opcional, default PENDENTE na camada de serviço/model)
	- observacoes: str (opcional)
	"""
	result = await _collection().insert_one(doc)
	return str(result.inserted_id)


async def find_by_id(scheduling_id: str) -> Optional[Dict[str, Any]]:
	try:
		_id = ObjectId(scheduling_id)
	except Exception:
		return None
	doc = await _collection().find_one({"_id": _id})
	return _to_response(doc)


async def list_schedules(*, filters: Optional[Dict[str, Any]] = None, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
	query = filters or {}
	cursor = _collection().find(query).skip(skip).limit(limit).sort("_id", -1)
	docs = await cursor.to_list(length=limit)
	return _to_response_many(docs)


async def find_by_produtor_id(produtor_id: str, *, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
	cursor = _collection().find({"produtorId": produtor_id}).skip(skip).limit(limit).sort("_id", -1)
	docs = await cursor.to_list(length=limit)
	return _to_response_many(docs)


async def find_by_residuo_id(residuo_id: str, *, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
	cursor = _collection().find({"residuosId": residuo_id}).skip(skip).limit(limit).sort("_id", -1)
	docs = await cursor.to_list(length=limit)
	return _to_response_many(docs)


async def find_by_any_residuo(residuos_id: List[str], *, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
	"""Busca agendamentos que incluam qualquer resíduo da lista fornecida."""
	if not residuos_id:
		return []
	cursor = _collection().find({"residuosId": {"$in": residuos_id}}).skip(skip).limit(limit).sort("_id", -1)
	docs = await cursor.to_list(length=limit)
	return _to_response_many(docs)


async def find_pending_for_residuo(residuo_id: str) -> Optional[Dict[str, Any]]:
	"""Retorna um agendamento PENDENTE para um dado resíduo (se existir)."""
	doc = await _collection().find_one({"residuosId": residuo_id, "status": "PENDENTE"})
	return _to_response(doc)


async def update_scheduling(scheduling_id: str, updates: Dict[str, Any]) -> bool:
	try:
		_id = ObjectId(scheduling_id)
	except Exception:
		return False
	if not updates:
		return True
	# Evita atualizar campos imutáveis
	updates = {k: v for k, v in updates.items() if k not in {"_id", "id"}}
	result = await _collection().update_one({"_id": _id}, {"$set": updates})
	return result.matched_count > 0


async def update_status(scheduling_id: str, new_status: str) -> bool:
	"""Atualiza apenas o status do agendamento."""
	try:
		_id = ObjectId(scheduling_id)
	except Exception:
		return False
	result = await _collection().update_one({"_id": _id}, {"$set": {"status": new_status}})
	return result.matched_count > 0


async def delete_scheduling(scheduling_id: str) -> bool:
	try:
		_id = ObjectId(scheduling_id)
	except Exception:
		return False
	result = await _collection().delete_one({"_id": _id})
	return result.deleted_count > 0


async def find_pendentes(*, limit: int = 500, skip: int = 0) -> List[Dict[str, Any]]:
	"""
	Busca todos os agendamentos com status PENDENTE.
	Usado para filtrar agendamentos disponíveis para coleta.
	
	Args:
		limit: Número máximo de documentos a retornar (padrão: 500)
		skip: Número de documentos a pular (paginação)
	
	Returns:
		Lista de agendamentos pendentes
	"""
	cursor = _collection().find({"status": "PENDENTE"}).skip(skip).limit(limit)
	docs = await cursor.to_list(length=limit)
	return _to_response_many(docs)


async def find_pendentes_por_proximidade(
	latitude: float,
	longitude: float,
	raio_km: float,
	*,
	limit: int = 100,
	skip: int = 0
) -> List[Dict[str, Any]]:
	"""
	Busca agendamentos PENDENTE próximos a uma localização usando query geoespacial.
	
	IMPORTANTE: Esta função assume que as coordenadas estão armazenadas como strings
	no formato "local.latitude" e "local.longitude". Futuramente, pensar em
	migrar para GeoJSON Point no futuro.
	
	Por enquanto, usa aggregation pipeline para:
	1. Filtrar por status PENDENTE
	2. Converter strings para números
	3. Calcular distância
	4. Filtrar por raio
	5. Ordenar por distância
	
	Args:
		latitude: Latitude central da busca
		longitude: Longitude central da busca
		raio_km: Raio de busca em quilômetros
		limit: Número máximo de resultados
		skip: Offset para paginação
	
	Returns:
		Lista de agendamentos com campo adicional 'distancia_km'
	"""
	# Converter raio para radianos (necessário para cálculo esférico)
	# Raio da Terra = 6371 km
	raio_radianos = raio_km / 6371.0
	
	pipeline = [
		# 1. Filtrar apenas PENDENTES
		{"$match": {"status": "PENDENTE"}},
		
		# 2. Adicionar campos calculados
		{"$addFields": {
			"lat_num": {"$toDouble": "$local.latitude"},
			"lon_num": {"$toDouble": "$local.longitude"}
		}},
		
		# 3. Filtrar documentos com coordenadas válidas
		{"$match": {
			"lat_num": {"$exists": True, "$ne": None},
			"lon_num": {"$exists": True, "$ne": None}
		}},
		
		# 4. Calcular distância usando fórmula Haversine (aproximação esférica)
		{"$addFields": {
			"distancia_radianos": {
				"$let": {
					"vars": {
						"dlat": {"$subtract": [{"$degreesToRadians": "$lat_num"}, {"$degreesToRadians": latitude}]},
						"dlon": {"$subtract": [{"$degreesToRadians": "$lon_num"}, {"$degreesToRadians": longitude}]},
						"lat1": {"$degreesToRadians": latitude},
						"lat2": {"$degreesToRadians": "$lat_num"}
					},
					"in": {
						"$let": {
							"vars": {
								"a": {
									"$add": [
										{"$pow": [{"$sin": {"$divide": ["$$dlat", 2]}}, 2]},
										{"$multiply": [
											{"$cos": "$$lat1"},
											{"$cos": "$$lat2"},
											{"$pow": [{"$sin": {"$divide": ["$$dlon", 2]}}, 2]}
										]}
									]
								}
							},
							"in": {
								"$multiply": [
									2,
									{"$atan2": [{"$sqrt": "$$a"}, {"$sqrt": {"$subtract": [1, "$$a"]}}]}
								]
							}
						}
					}
				}
			}
		}},
		
		# 5. Converter distância para km
		{"$addFields": {
			"distancia_km": {"$multiply": ["$distancia_radianos", 6371.0]}
		}},
		
		# 6. Filtrar por raio
		{"$match": {"distancia_km": {"$lte": raio_km}}},
		
		# 7. Ordenar por distância (mais próximo primeiro)
		{"$sort": {"distancia_km": 1}},
		
		# 8. Paginação
		{"$skip": skip},
		{"$limit": limit},
		
		# 9. Limpar campos temporários
		{"$project": {
			"lat_num": 0,
			"lon_num": 0,
			"distancia_radianos": 0
		}}
	]
	
	cursor = _collection().aggregate(pipeline)
	docs = await cursor.to_list(length=limit)
	return _to_response_many(docs)


