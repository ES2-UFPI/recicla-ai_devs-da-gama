from passlib.context import CryptContext
from fastapi import HTTPException, status

from src.schemas.user_schema import UserCreate, UserInDB
from src.schemas.return_schema import UserPublic
from src.infra.database.repositories import user_repo


# Use bcrypt_sha256 to avoid the 72-byte password input limit of raw bcrypt
pwd_ctx = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")


class UserService:
	"""
	Camada de serviço responsável pela lógica de negócio relacionada a usuários.
	Implementa o padrão Service Layer, separando a lógica de negócio do controller.
	"""

	@staticmethod
	async def create_user(payload: UserCreate) -> UserPublic:
		"""
		Cria um novo usuário no sistema.
		
		Args:
			payload: Dados do usuário a ser criado
			
		Returns:
			UserPublic: Dados públicos do usuário criado
			
		Raises:
			HTTPException: Se o e-mail já estiver cadastrado ou ocorrer erro na criação
		"""
		try:
			# Validar unicidade de e-mail
			existing = await user_repo.find_by_email(payload.email)
			if existing:
				raise HTTPException(
					status_code=status.HTTP_409_CONFLICT,
					detail="E-mail já cadastrado."
				)

			# Gerar hash da senha
			password_hash = pwd_ctx.hash(payload.password)

			# Preparar documento para persistência
			doc = {
				"name": payload.name,
				"email": payload.email,
				"phone": payload.phone,
				"password_hash": password_hash,
				"role_id": payload.role_id,
				"cidade_id": payload.cidade_id,
				"estado_id": payload.estado_id,
			}

			# Persistir usuário
			inserted_id = await user_repo.create_user(doc)
			
			# Recuperar usuário criado
			created = await user_repo.find_by_id(inserted_id)
			if not created:
				raise HTTPException(
					status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
					detail="Falha ao recuperar usuário criado."
				)
			
			# Retornar dados públicos
			return UserPublic(
				name=created["name"],
				email=created["email"],
				role_id=created["role_id"]
			)
			
		except HTTPException:
			raise
		except Exception as e:
			raise HTTPException(
				status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
				detail=f"Erro ao criar usuário: {e.__class__.__name__}: {str(e)}"
			)

	@staticmethod
	async def get_user_by_id(user_id: str) -> UserPublic:
		"""
		Recupera um usuário pelo ID.
		
		Args:
			user_id: ID do usuário
			
		Returns:
			UserPublic: Dados públicos do usuário
			
		Raises:
			HTTPException: Se o usuário não for encontrado
		"""
		user = await user_repo.find_by_id(user_id)
		if not user:
			raise HTTPException(
				status_code=status.HTTP_404_NOT_FOUND,
				detail="Usuário não encontrado."
			)
		
		return UserPublic(
			name=user["name"],
			email=user["email"],
			role_id=user["role_id"]
		)

	@staticmethod
	async def get_user_by_email(email: str) -> UserPublic:
		"""
		Recupera um usuário pelo e-mail.
		
		Args:
			email: E-mail do usuário
			
		Returns:
			UserPublic: Dados públicos do usuário
			
		Raises:
			HTTPException: Se o usuário não for encontrado
		"""
		user = await user_repo.find_by_email(email)
		if not user:
			raise HTTPException(
				status_code=status.HTTP_404_NOT_FOUND,
				detail="Usuário não encontrado."
			)
		
		return UserPublic(
			name=user["name"],
			email=user["email"],
			role_id=user["role_id"]
		)
