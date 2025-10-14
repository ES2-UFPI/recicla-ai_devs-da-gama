"""
Router de autenticação com endpoints para login, logout, refresh e informações do usuário.
Implementa autenticação baseada em cookies HTTP-only.
"""
from fastapi import APIRouter, Response, Cookie, Depends, status
from typing import Optional

from src.schemas.auth_schema import (
	LoginRequest,
	LoginResponse,
	LogoutResponse,
	RefreshResponse
)
from src.schemas.return_schema import UserPublic
from src.service.auth_service import AuthService
from src.infra.security.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(payload: LoginRequest, response: Response):
	"""
	Endpoint de login.
	
	Autentica o usuário por e-mail/telefone e senha, gerando tokens JWT
	que são armazenados em cookies HTTP-only.
	
	**Fluxo:**
	1. Valida credenciais
	2. Gera access_token (15min) e refresh_token (7 dias)
	3. Seta cookies HTTP-only, Secure e SameSite
	4. Retorna dados públicos do usuário
	
	**Segurança:**
	- Tokens inacessíveis via JavaScript (XSS protection)
	- SameSite cookies (CSRF protection)
	- Secure flag em produção (HTTPS only)
	"""
	user = await AuthService.login(payload, response)
	
	return LoginResponse(
		message="Login realizado com sucesso",
		user=user
	)


@router.post("/logout", response_model=LogoutResponse)
async def logout(
	response: Response,
	access_token: Optional[str] = Cookie(None),
	refresh_token: Optional[str] = Cookie(None)
):
	"""
	Endpoint de logout.
	
	Revoga os tokens atuais e remove cookies.
	
	**Fluxo:**
	1. Adiciona tokens à blacklist (se existirem)
	2. Remove cookies (max_age=0)
	
	**Nota:** Não requer autenticação para permitir logout mesmo com token expirado.
	"""
	await AuthService.logout(access_token, refresh_token, response)
	
	return LogoutResponse(message="Logout realizado com sucesso")


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(
	response: Response,
	refresh_token: Optional[str] = Cookie(None)
):
	"""
	Endpoint para renovar o access token.
	
	Usa o refresh_token para gerar um novo access_token sem exigir
	que o usuário faça login novamente.
	
	**Fluxo:**
	1. Valida refresh_token
	2. Verifica se não está na blacklist
	3. Gera novo access_token
	4. Atualiza cookie
	
	**Uso típico:**
	Frontend detecta que access_token expirou (401) e chama este endpoint.
	"""
	if not refresh_token:
		from fastapi import HTTPException
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Refresh token não encontrado."
		)
	
	await AuthService.refresh_tokens(refresh_token, response)
	
	return RefreshResponse(message="Token renovado com sucesso")


@router.get("/me", response_model=UserPublic)
async def get_current_user_info(user: dict = Depends(get_current_user)):
	"""
	Endpoint para obter informações do usuário autenticado.
	
	**Protegido:** Requer access_token válido em cookie.
	
	Retorna dados públicos do usuário atualmente autenticado.
	Útil para o frontend verificar o estado de autenticação
	e obter informações do usuário logado.
	
	**Exemplo de uso:**
	```javascript
	// Frontend verifica se está autenticado
	fetch('/auth/me', { credentials: 'include' })
	  .then(res => res.json())
	  .then(user => console.log('Usuário logado:', user))
	  .catch(() => console.log('Não autenticado'))
	```
	"""
	return UserPublic(
		name=user["name"],
		email=user["email"],
		role_id=user["role_id"]
	)
