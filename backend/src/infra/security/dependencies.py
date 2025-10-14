"""
Dependências de autenticação para uso em rotas protegidas.
Implementa extração e validação de tokens de cookies.
"""
from fastapi import Cookie, HTTPException, status, Depends
from typing import Optional, Dict, Any

from src.infra.security.jwt_handler import (
	verify_token_type,
	get_user_id_from_token
)
from src.infra.security.token_blacklist import token_blacklist
from src.infra.database.repositories import user_repo


async def get_current_user(
	access_token: Optional[str] = Cookie(None)
) -> Dict[str, Any]:
	"""
	Dependency para extrair o usuário autenticado do access token.
	
	Valida:
	- Existência do token
	- Tipo correto (access)
	- Token não revogado (blacklist)
	- Usuário ainda existe no banco
	
	Args:
		access_token: Token JWT extraído do cookie
		
	Returns:
		Dict com dados do usuário autenticado
		
	Raises:
		HTTPException 401: Se o token for inválido ou usuário não encontrado
	
	Uso:
		@router.get("/protected")
		async def protected_route(user: dict = Depends(get_current_user)):
			return {"user_id": user["_id"]}
	"""
	if not access_token:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Não autenticado. Token não encontrado."
		)
	
	# Valida tipo do token
	if not verify_token_type(access_token, "access"):
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Token inválido ou expirado."
		)
	
	# Verifica blacklist
	if token_blacklist.is_blacklisted(access_token):
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Token revogado. Faça login novamente."
		)
	
	# Extrai user_id
	user_id = get_user_id_from_token(access_token)
	if not user_id:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Token inválido."
		)
	
	# Busca usuário no banco
	user = await user_repo.find_by_id(user_id)
	if not user:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Usuário não encontrado."
		)
	
	return user


async def get_optional_user(
	access_token: Optional[str] = Cookie(None)
) -> Optional[Dict[str, Any]]:
	"""
	Dependency para extrair usuário autenticado de forma opcional.
	Não lança exceção se o token não existir ou for inválido.
	
	Útil para rotas que podem funcionar com ou sem autenticação.
	
	Returns:
		Dict com dados do usuário ou None se não autenticado
	
	Uso:
		@router.get("/public-or-private")
		async def route(user: Optional[dict] = Depends(get_optional_user)):
			if user:
				return {"message": f"Olá, {user['name']}"}
			return {"message": "Olá, visitante"}
	"""
	try:
		return await get_current_user(access_token)
	except HTTPException:
		return None


def require_role(*allowed_roles: str):
	"""
	Factory de dependency para verificar se o usuário tem um dos roles permitidos.
	
	Args:
		*allowed_roles: Roles permitidos (ex: "admin", "coletor")
		
	Returns:
		Dependency function que valida o role
		
	Raises:
		HTTPException 403: Se o usuário não tiver permissão
	
	Uso:
		@router.delete("/admin-only")
		async def admin_route(user: dict = Depends(require_role("admin"))):
			return {"message": "Você é admin!"}
	"""
	async def role_checker(
		user: Dict[str, Any] = Depends(get_current_user)
	) -> Dict[str, Any]:
		user_role = user.get("role_id")
		
		if user_role not in allowed_roles:
			raise HTTPException(
				status_code=status.HTTP_403_FORBIDDEN,
				detail=f"Acesso negado. Requer um dos roles: {', '.join(allowed_roles)}"
			)
		
		return user
	
	return role_checker
