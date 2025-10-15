"""
Serviço de autenticação responsável por login, logout e refresh de tokens.
Implementa lógica de negócio de gestão de sessões.
"""
from passlib.context import CryptContext
from fastapi import HTTPException, status, Response
from typing import Optional, Dict, Any, Literal
import os

from src.schemas.auth_schema import LoginRequest
from src.infra.database.repositories import user_repo
from src.infra.security.jwt_handler import (
	create_access_token,
	create_refresh_token,
	get_token_expiration,
	verify_token_type,
	get_user_id_from_token,
	ACCESS_TOKEN_EXPIRE_MINUTES,
	REFRESH_TOKEN_EXPIRE_DAYS
)
from src.infra.security.token_blacklist import token_blacklist

# Configuração de hash de senhas (mesma do user_service)
pwd_ctx = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")

# Configurações de cookies do .env
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN", "localhost")
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"

# Converter string do .env para tipo literal aceito pelo FastAPI
_samesite_value = os.getenv("COOKIE_SAMESITE", "lax").lower()
COOKIE_SAMESITE: Literal["lax", "strict", "none"] = (
	"lax" if _samesite_value == "lax"
	else "strict" if _samesite_value == "strict"
	else "none" if _samesite_value == "none"
	else "lax"  # fallback padrão
)

# Calcula max_age dos cookies baseado nas configurações JWT
ACCESS_TOKEN_COOKIE_MAX_AGE = ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Converte minutos para segundos
REFRESH_TOKEN_COOKIE_MAX_AGE = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60  # Converte dias para segundos

class AuthService:
	"""
	Camada de serviço responsável pela lógica de autenticação.
	Separada do UserService para manter responsabilidades distintas.
	"""
	
	@staticmethod
	async def authenticate_user(credential: str, password: str) -> Optional[Dict[str, Any]]:
		"""
		Autentica um usuário por e-mail/telefone e senha.
		
		Args:
			credential: E-mail ou telefone do usuário
			password: Senha em texto plano
			
		Returns:
			Dict com dados do usuário ou None se credenciais inválidas
		"""
		# Tenta buscar por e-mail primeiro
		user = await user_repo.find_by_email(credential)
		
		# TODO: Adicionar busca por telefone quando o repositório suportar
		# if not user:
		#     user = await user_repo.find_by_phone(credential)
		
		if not user:
			return None
		
		# Verifica senha
		password_hash = user.get("password_hash")
		if not password_hash or not pwd_ctx.verify(password, password_hash):
			return None
		
		return user
	
	@staticmethod
	async def login(payload: LoginRequest, response: Response) -> Dict[str, Any]:
		"""
		Realiza login do usuário e configura cookies HTTP-only com tokens.
		
		Args:
			payload: Dados de login (credential + password)
			response: Objeto Response do FastAPI para setar cookies
			
		Returns:
			Dict com dados públicos do usuário
			
		Raises:
			HTTPException: Se credenciais forem inválidas
		"""
		# Autentica usuário
		user = await AuthService.authenticate_user(
			payload.credential, 
			payload.password
		)
		
		if not user:
			raise HTTPException(
				status_code=status.HTTP_401_UNAUTHORIZED,
				detail="Credenciais inválidas."
			)
		
		user_id = user["_id"]
		
		# Gera tokens
		access_token = create_access_token(user_id)
		refresh_token = create_refresh_token(user_id)
		
		# Configura cookies HTTP-only
		response.set_cookie(
			key="access_token",
			value=access_token,
			httponly=True,  # Não acessível via JavaScript (XSS protection)
			secure=COOKIE_SECURE,  # Apenas HTTPS em produção
			samesite=COOKIE_SAMESITE,  # CSRF protection
			max_age=ACCESS_TOKEN_COOKIE_MAX_AGE,  # 15 minutos em segundos
			path="/",
			domain=COOKIE_DOMAIN
		)
		
		response.set_cookie(
			key="refresh_token",
			value=refresh_token,
			httponly=True,
			secure=COOKIE_SECURE,
			samesite=COOKIE_SAMESITE,
			max_age=REFRESH_TOKEN_COOKIE_MAX_AGE,  # 7 dias em segundos
			path="/",
			domain=COOKIE_DOMAIN
		)
		
		# Retorna dados públicos do usuário
		return {
			"_id": user_id,
			"name": user.get("name"),
			"email": user.get("email"),
			"role_id": user.get("role_id")
		}
	
	@staticmethod
	async def refresh_tokens(refresh_token: str, response: Response) -> None:
		"""
		Renova o access token usando um refresh token válido.
		
		Args:
			refresh_token: Token de refresh do cookie
			response: Objeto Response do FastAPI para setar novo cookie
			
		Raises:
			HTTPException: Se o refresh token for inválido ou expirado
		"""
		# Valida se é um refresh token
		if not verify_token_type(refresh_token, "refresh"):
			raise HTTPException(
				status_code=status.HTTP_401_UNAUTHORIZED,
				detail="Token de refresh inválido."
			)
		
		# Verifica se está na blacklist
		if token_blacklist.is_blacklisted(refresh_token):
			raise HTTPException(
				status_code=status.HTTP_401_UNAUTHORIZED,
				detail="Token revogado. Faça login novamente."
			)
		
		# Extrai user_id
		user_id = get_user_id_from_token(refresh_token)
		if not user_id:
			raise HTTPException(
				status_code=status.HTTP_401_UNAUTHORIZED,
				detail="Token inválido."
			)
		
		# Verifica se o usuário ainda existe
		user = await user_repo.find_by_id(user_id)
		if not user:
			raise HTTPException(
				status_code=status.HTTP_401_UNAUTHORIZED,
				detail="Usuário não encontrado."
			)
		
		# Gera novo access token
		new_access_token = create_access_token(user_id)
		
		# Atualiza cookie
		response.set_cookie(
			key="access_token",
			value=new_access_token,
			httponly=True,
			secure=COOKIE_SECURE,
			samesite=COOKIE_SAMESITE,
			max_age=ACCESS_TOKEN_COOKIE_MAX_AGE,  # 15 minutos em segundos
			path="/",
			domain=COOKIE_DOMAIN
		)
	
	@staticmethod
	async def logout(
		access_token: Optional[str], 
		refresh_token: Optional[str],
		response: Response
	) -> None:
		"""
		Realiza logout revogando tokens e removendo cookies.
		
		Args:
			access_token: Access token atual (pode ser None)
			refresh_token: Refresh token atual (pode ser None)
			response: Objeto Response do FastAPI para limpar cookies
		"""
		# Adiciona tokens à blacklist se existirem
		if access_token:
			exp = get_token_expiration(access_token)
			if exp:
				token_blacklist.add(access_token, exp)
		
		if refresh_token:
			exp = get_token_expiration(refresh_token)
			if exp:
				token_blacklist.add(refresh_token, exp)
		
		# Remove cookies (seta max_age=0)
		response.delete_cookie(
			key="access_token",
			path="/",
			domain=COOKIE_DOMAIN
		)
		response.delete_cookie(
			key="refresh_token",
			path="/",
			domain=COOKIE_DOMAIN
		)
