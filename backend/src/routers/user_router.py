from fastapi import APIRouter, status, Depends
from typing import List, Dict, Any

from src.schemas.relatorio_schema import RelatorioByCategoryResponse

from src.schemas.user_schema import UserCreate, UserUpdate, Endereco
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


@router.patch("/me", response_model=UserPublic)
async def update_user(
	payload: UserUpdate,
	current_user: dict = Depends(get_current_user)
):
	"""
	Atualiza parcialmente dados do usuário.
	
	Requer autenticação. Apenas o próprio usuário pode se atualizar.
	Permite atualizar: name, email, phone, password, addresses, cidade_id, estado_id.
	"""
	# Verificar se o usuário está atualizando seus próprios dados
	if current_user.get("id") != current_user.get("id"):
		from fastapi import HTTPException
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Você só pode atualizar seus próprios dados."
		)

	return await UserService.update_user(current_user.get("id"), payload)


@router.get("/me/report", response_model=RelatorioByCategoryResponse)
async def get_producer_report(current_user: dict = Depends(get_current_user)):
	"""
	Gera relatório do usuário autenticado.

	Requer autenticação. Apenas o próprio usuário pode acessar seu relatório.
	"""
	# Verificar se o usuário está acessando seu próprio relatório
	if current_user.get("id") != current_user.get("id"):
		from fastapi import HTTPException
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Você só pode acessar seus próprios relatórios."
		)

	report = await UserService.generate_report(current_user.get("id"))
	return report


@router.get("/me/addresses", response_model=List[Endereco])
async def get_user_addresses(
	current_user: dict = Depends(get_current_user)
):
	"""
	Lista todos os endereços do usuário.
	
	Requer autenticação. Apenas o próprio usuário pode ver seus endereços.
	"""
	# Verificar se o usuário está acessando seus próprios endereços
	if current_user.get("id") != current_user.get("id"):
		from fastapi import HTTPException
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Você só pode acessar seus próprios endereços."
		)

	addresses = await UserService.get_addresses(current_user.get("id"))
	return addresses


@router.post("/me/addresses", status_code=status.HTTP_201_CREATED)
async def add_user_address(
	address: Endereco,
	current_user: dict = Depends(get_current_user)
):
	"""
	Adiciona um novo endereço ao usuário.
	
	Requer autenticação. Apenas o próprio usuário pode adicionar endereços.
	O apelido do endereço deve ser único para o usuário.
	"""
	# Verificar se o usuário está adicionando endereço a si mesmo
	if current_user.get("id") != current_user.get("id"):
		from fastapi import HTTPException
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Você só pode adicionar endereços a si mesmo."
		)

	return await UserService.add_address(current_user.get("id"), address)


@router.put("/me/addresses/{address_id}")
async def update_user_address(
	address_id: int,
	updates: Dict[str, Any],
	current_user: dict = Depends(get_current_user)
):
	"""
	Atualiza um endereço existente do usuário.
	
	Requer autenticação. Apenas o próprio usuário pode atualizar seus endereços.
	Identificação do endereço é feita pelo ID.
	
	Campos atualizáveis: apelido, cep, logradouro, numero, latitude, longitude, complemento.
	"""
	# Verificar se o usuário está atualizando seu próprio endereço
	if current_user.get("id") != current_user.get("id"):
		from fastapi import HTTPException
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Você só pode atualizar seus próprios endereços."
		)

	return await UserService.update_address(current_user.get("id"), address_id, updates)


@router.delete("/me/addresses/{address_id}")
async def remove_user_address(
	address_id: int,
	current_user: dict = Depends(get_current_user)
):
	"""
	Remove um endereço do usuário.
	
	Requer autenticação. Apenas o próprio usuário pode remover seus endereços.
	Identificação do endereço é feita pelo ID.
	"""
	# Verificar se o usuário está removendo seu próprio endereço
	if current_user.get("id") != current_user.get("id"):
		from fastapi import HTTPException
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Você só pode remover seus próprios endereços."
		)

	return await UserService.remove_address(current_user.get("id"), address_id)
