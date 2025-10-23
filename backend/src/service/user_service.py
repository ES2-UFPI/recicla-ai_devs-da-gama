from passlib.context import CryptContext
from fastapi import HTTPException, status
from typing import List, Dict, Any

from src.schemas.user_schema import UserCreate, UserInDB, UserUpdate, Endereco
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

	@staticmethod
	async def update_user(user_id: str, payload: UserUpdate) -> UserPublic:
		"""
		Atualiza dados de um usuário.
		
		Args:
			user_id: ID do usuário
			payload: Dados a serem atualizados
			
		Returns:
			UserPublic: Dados públicos do usuário atualizado
			
		Raises:
			HTTPException: Se o usuário não for encontrado ou erro na atualização
		"""
		# Verificar se usuário existe
		user = await user_repo.find_by_id(user_id)
		if not user:
			raise HTTPException(
				status_code=status.HTTP_404_NOT_FOUND,
				detail="Usuário não encontrado."
			)
		
		# Preparar updates
		updates = payload.model_dump(exclude_unset=True)
		
		# Se estiver atualizando senha, gerar hash
		if "password" in updates:
			updates["password_hash"] = pwd_ctx.hash(updates.pop("password"))
		
		# Se estiver atualizando email, verificar unicidade
		if "email" in updates and updates["email"] != user["email"]:
			existing = await user_repo.find_by_email(updates["email"])
			if existing:
				raise HTTPException(
					status_code=status.HTTP_409_CONFLICT,
					detail="E-mail já cadastrado por outro usuário."
				)
		
		# Atualizar usuário
		success = await user_repo.update_user(user_id, updates)
		if not success:
			raise HTTPException(
				status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
				detail="Falha ao atualizar usuário."
			)
		
		# Recuperar usuário atualizado
		updated = await user_repo.find_by_id(user_id)
		return UserPublic(
			name=updated["name"],
			email=updated["email"],
			role_id=updated["role_id"]
		)

	@staticmethod
	async def get_addresses(user_id: str) -> List[Dict[str, Any]]:
		"""
		Recupera todos os endereços de um usuário.
		
		Args:
			user_id: ID do usuário
			
		Returns:
			List[Dict]: Lista de endereços
			
		Raises:
			HTTPException: Se o usuário não for encontrado
		"""
		user = await user_repo.find_by_id(user_id)
		if not user:
			raise HTTPException(
				status_code=status.HTTP_404_NOT_FOUND,
				detail="Usuário não encontrado."
			)
		
		addresses = await user_repo.get_addresses(user_id)
		return addresses or []

	@staticmethod
	async def add_address(user_id: str, address: Endereco) -> Dict[str, Any]:
		"""
		Adiciona um novo endereço ao usuário.
		
		Args:
			user_id: ID do usuário
			address: Dados do endereço
			
		Returns:
			Dict: Mensagem de sucesso com o ID do endereço criado
			
		Raises:
			HTTPException: Se o usuário não for encontrado ou erro na adição
		"""
		# Verificar se usuário existe
		user = await user_repo.find_by_id(user_id)
		if not user:
			raise HTTPException(
				status_code=status.HTTP_404_NOT_FOUND,
				detail="Usuário não encontrado."
			)
		
		# Adicionar endereço (o ID será gerado automaticamente no repositório)
		address_dict = address.model_dump(exclude={"id"})  # Excluir id do payload
		success = await user_repo.add_address(user_id, address_dict)
		if not success:
			raise HTTPException(
				status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
				detail="Falha ao adicionar endereço."
			)
		
		# Buscar os endereços atualizados para pegar o ID do novo endereço
		updated_addresses = await user_repo.get_addresses(user_id)
		new_address = updated_addresses[-1] if updated_addresses else None
		
		return {
			"message": "Endereço adicionado com sucesso.",
			"id": new_address.get("id") if new_address else None
		}

	@staticmethod
	async def update_address(user_id: str, address_id: int, updates: Dict[str, Any]) -> Dict[str, str]:
		"""
		Atualiza um endereço existente do usuário.
		
		Args:
			user_id: ID do usuário
			address_id: ID do endereço a ser atualizado
			updates: Campos a serem atualizados
			
		Returns:
			Dict: Mensagem de sucesso
			
		Raises:
			HTTPException: Se o usuário/endereço não for encontrado ou erro na atualização
		"""
		# Verificar se usuário existe
		user = await user_repo.find_by_id(user_id)
		if not user:
			raise HTTPException(
				status_code=status.HTTP_404_NOT_FOUND,
				detail="Usuário não encontrado."
			)
		
		# Verificar se endereço existe
		addresses = await user_repo.get_addresses(user_id)
		if not any(addr.get("id") == address_id for addr in addresses):
			raise HTTPException(
				status_code=status.HTTP_404_NOT_FOUND,
				detail=f"Endereço com ID {address_id} não encontrado."
			)
		
		# Atualizar endereço
		success = await user_repo.update_address(user_id, address_id, updates)
		if not success:
			raise HTTPException(
				status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
				detail="Falha ao atualizar endereço."
			)
		
		return {"message": f"Endereço ID {address_id} atualizado com sucesso."}

	@staticmethod
	async def remove_address(user_id: str, address_id: int) -> Dict[str, str]:
		"""
		Remove um endereço do usuário.
		
		Args:
			user_id: ID do usuário
			address_id: ID do endereço a ser removido
			
		Returns:
			Dict: Mensagem de sucesso
			
		Raises:
			HTTPException: Se o usuário/endereço não for encontrado ou erro na remoção
		"""
		# Verificar se usuário existe
		user = await user_repo.find_by_id(user_id)
		if not user:
			raise HTTPException(
				status_code=status.HTTP_404_NOT_FOUND,
				detail="Usuário não encontrado."
			)
		
		# Verificar se endereço existe
		addresses = await user_repo.get_addresses(user_id)
		if not any(addr.get("id") == address_id for addr in addresses):
			raise HTTPException(
				status_code=status.HTTP_404_NOT_FOUND,
				detail=f"Endereço com ID {address_id} não encontrado."
			)
		
		# Remover endereço
		success = await user_repo.remove_address(user_id, address_id)
		if not success:
			raise HTTPException(
				status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
				detail="Falha ao remover endereço."
			)
		
		return {"message": f"Endereço ID {address_id} removido com sucesso."}
