import os
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

_client: Optional[AsyncIOMotorClient] = None


def get_client() -> AsyncIOMotorClient:
	global _client
	if _client is None:
		mongo_uri = os.getenv("MONGO_URI")
		if not mongo_uri:
			raise RuntimeError(
				"MONGO_URI não definida. Configure em backend/.env ou nas variáveis do container."
			)
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

