import os
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

_client: Optional[AsyncIOMotorClient] = None


def _resolve_mongo_uri() -> str:
	"""Resolve a URI do Mongo com base nas variáveis de ambiente.

	Prioridades:
	1) Se USE_ATLAS=true e MONGO_URI_ATLAS definida, usar MONGO_URI_ATLAS
	2) Caso contrário, usar MONGO_URI_LOCAL se definida
	3) Por compatibilidade, aceitar MONGO_URI (antigo)
	"""
	use_atlas = os.getenv("USE_ATLAS", "false").lower() == "true"
	uri_atlas = os.getenv("MONGO_URI_ATLAS")
	uri_local = os.getenv("MONGO_URI_LOCAL")
	uri_legacy = os.getenv("MONGO_URI")

	if use_atlas and uri_atlas:
		return uri_atlas
	if uri_local:
		return uri_local
	if uri_legacy:
		return uri_legacy

	raise RuntimeError(
		"Nenhuma URI do Mongo definida. Configure MONGO_URI_LOCAL (dev) ou MONGO_URI_ATLAS com USE_ATLAS=true."
	)


def get_client() -> AsyncIOMotorClient:
	global _client
	if _client is None:
		mongo_uri = _resolve_mongo_uri()
		_client = AsyncIOMotorClient(
			mongo_uri,
			serverSelectionTimeoutMS=5000,
			connectTimeoutMS=5000,
			appname=os.getenv("MONGO_APP_NAME", "recicla-ai-backend"),
		)
	return _client


def get_database() -> AsyncIOMotorDatabase:
	db_name = os.getenv("DB_NAME", "ReciclaAi")
	return get_client()[db_name]

