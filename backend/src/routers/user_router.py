from fastapi import APIRouter, status, Depends

from src.schemas.user_schema import UserCreate
from src.schemas.return_schema import UserPublic
from src.service.user_service import UserService
from src.infra.security.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreate):
	"""
	Endpoint para criação de novo usuário.
	Delega a lógica de negócio para a camada de serviço.
	"""
	return await UserService.create_user(payload)


@router.get("/{user_id}", response_model=UserPublic)
async def get_user(user_id: str):
	"""
	Endpoint para recuperar usuário por ID.
	Delega a lógica de negócio para a camada de serviço.
	"""
	return await UserService.get_user_by_id(user_id)


@router.get("/email/{email}", response_model=UserPublic)
async def get_user_by_email(email: str):
	"""
	Endpoint para recuperar usuário por e-mail.
	Delega a lógica de negócio para a camada de serviço.
	"""
	return await UserService.get_user_by_email(email)


@router.get("/me", response_model=UserPublic)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
	"""
	Endpoint protegido para obter o perfil do usuário autenticado.
	
	Requer autenticação via cookie HTTP-only (access_token).
	Retorna os dados públicos do usuário logado.
	
	Este endpoint demonstra como proteger rotas usando a dependency get_current_user.
	"""
	return UserPublic(
		name=current_user["name"],
		email=current_user["email"],
		role_id=current_user["role_id"]
	)
