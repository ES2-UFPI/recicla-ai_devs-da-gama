"""
Módulo responsável pela geração, validação e decodificação de tokens JWT.
Implementa access tokens (curta duração) e refresh tokens (longa duração).
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import jwt, JWTError
import os
from dotenv import load_dotenv

load_dotenv()

# Configurações JWT das variáveis de ambiente
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))


def create_access_token(user_id: str) -> str:
	"""
	Cria um access token JWT com curta duração.
	
	Args:
		user_id: ID do usuário para incluir no token
		
	Returns:
		str: Token JWT codificado
	"""
	payload = {
		"sub": user_id,  # Subject: ID do usuário
		"type": "access",  # Tipo do token
		"exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
		"iat": datetime.utcnow()  # Issued at
	}
	return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: str) -> str:
	"""
	Cria um refresh token JWT com longa duração.
	
	Args:
		user_id: ID do usuário para incluir no token
		
	Returns:
		str: Token JWT codificado
	"""
	payload = {
		"sub": user_id,
		"type": "refresh",
		"exp": datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
		"iat": datetime.utcnow()
	}
	return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
	"""
	Decodifica e valida um token JWT.
	
	Args:
		token: Token JWT a ser decodificado
		
	Returns:
		Dict com o payload do token ou None se inválido
	"""
	try:
		payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
		return payload
	except JWTError:
		return None


def verify_token_type(token: str, expected_type: str) -> bool:
	"""
	Verifica se o token é do tipo esperado (access ou refresh).
	
	Args:
		token: Token JWT a ser verificado
		expected_type: Tipo esperado ("access" ou "refresh")
		
	Returns:
		bool: True se o token é válido e do tipo correto
	"""
	payload = decode_token(token)
	if not payload:
		return False
	return payload.get("type") == expected_type


def get_token_expiration(token: str) -> Optional[datetime]:
	"""
	Extrai a data de expiração de um token.
	
	Args:
		token: Token JWT
		
	Returns:
		datetime ou None se o token for inválido
	"""
	payload = decode_token(token)
	if not payload or "exp" not in payload:
		return None
	return datetime.fromtimestamp(payload["exp"])


def get_user_id_from_token(token: str) -> Optional[str]:
	"""
	Extrai o user_id (subject) de um token JWT.
	
	Args:
		token: Token JWT
		
	Returns:
		str com o user_id ou None se inválido
	"""
	payload = decode_token(token)
	if not payload:
		return None
	return payload.get("sub")
