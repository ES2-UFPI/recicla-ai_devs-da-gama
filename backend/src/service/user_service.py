from fastapi import HTTPException, status
from typing import List, Dict, Any

from src.schemas.user_schema import UserCreate, UserInDB, UserUpdate, Endereco
from src.schemas.return_schema import UserPublic
from src.infra.database.repositories import user_repo, entrega_repo, residue_repo, categoria_repo
from src.builders.user import UserBuilderFactory, get_user_builder


class UserService:
	"""
	Camada de serviço responsável pela lógica de negócio relacionada a usuários.
	Implementa o padrão Service Layer, separando a lógica de negócio do controller.
	"""

	@staticmethod
	async def create_user(payload: UserCreate) -> UserPublic:
		"""
		Cria um novo usuário no sistema utilizando User Builders.
		
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

			# Criar builder específico baseado no role_id (type-safe)
			if payload.role_id == "produtor":
				builder = UserBuilderFactory.create_produtor()
			elif payload.role_id == "coletor":
				builder = UserBuilderFactory.create_coletor()
			elif payload.role_id == "receptor":
				builder = UserBuilderFactory.create_receptor()
			else:
				raise HTTPException(
					status_code=status.HTTP_400_BAD_REQUEST,
					detail=f"Role '{payload.role_id}' não suportado. Use: produtor, coletor ou receptor."
				)
			
			# Inicializar builder com payload
			builder.from_create_payload(payload)
			
			# Construir documento para persistência
			doc = builder.build_for_db()

			# Persistir usuário
			inserted_id = await user_repo.create_user(doc)
			
			# Recuperar usuário criado
			created = await user_repo.find_by_id(inserted_id)
			if not created:
				raise HTTPException(
					status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
					detail="Falha ao recuperar usuário criado."
				)
			
			# Construir resposta pública usando builder
			builder = get_user_builder(created)  # Auto-detecta o tipo
			return builder.build_public()
			
		except HTTPException:
			raise
		except ValueError as e:
			# Erros de validação do builder
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail=str(e)
			)
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
		
		# Usar builder para construir resposta pública
		builder = get_user_builder(user)  # Auto-detecta o tipo baseado no documento
		return builder.build_public()

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
		
		# Usar builder para construir resposta pública
		builder = get_user_builder(user)
		return builder.build_public()

	@staticmethod
	async def generate_report(user_id: str) -> Dict[str, Any]:
		"""
		Gera um relatório resumido do usuário.

		Baseado em `get_user_by_email`/`get_user_by_id`: valida a existência do usuário
		e retorna informações públicas agregadas e alguns indicadores simples.

		Args:
			user_id: ID do usuário

		Returns:
			Dict[str, Any]: Relatório contendo dados públicos, endereços, pontos e métricas por papel

		Raises:
			HTTPException 404: Se o usuário não existir
		"""

		# Recupera usuário
		user = await user_repo.find_by_id(user_id)
		if not user:
			raise HTTPException(
				status_code=status.HTTP_404_NOT_FOUND,
				detail="Usuário não encontrado."
			)

		# Verifica se o usuário é produtor ou receptor
		role = user.get("role_id")
		if role not in ("produtor", "receptor"):
			raise HTTPException(
				status_code=status.HTTP_403_FORBIDDEN,
				detail="Relatório disponível apenas para produtores ou receptoras."
			)

		# Construir resposta pública com builder
		builder = get_user_builder(user)
		public = builder.build_public()

		# Se for produtor, buscar resíduos COLETADO ou ENTREGUE do produtor
		if role == "produtor":
			filters = {"produtorId": user_id, "status": {"$in": ["COLETADO", "ENTREGUE"]}}
			residues = await residue_repo.list_residues(filters=filters, limit=1000)

			# Agrupar por tipo de categoria e somar quantidade
			category_sums: Dict[str, float] = {}
			for r in residues:
				categoria_id = r.get("categoriaId")
				# Buscar categoria para obter o campo 'tipo'
				categoria_doc = None
				if categoria_id:
					categoria_doc = await categoria_repo.buscar_por_id(str(categoria_id))
				cat_tipo = categoria_doc.get("tipo") if categoria_doc else str(categoria_id)
				quant = r.get("quantidade", 0) or 0
				try:
					quant = float(quant)
				except Exception:
					quant = 0.0
				category_sums[cat_tipo] = category_sums.get(cat_tipo, 0.0) + quant

			# Formatar resultado como lista
			result = [{"categoria": k, "quantidade": v} for k, v in category_sums.items()]
			return {"by_category": result}
		# Caso seja receptora, buscar todas as entregas recebidas e coletar os resíduos
		if role == "receptor":
			# Buscar entregas onde esta usuária é a receptora
			entregas = await entrega_repo.find_by_receptora_id(user_id, limit=10000, skip=0)

			# Agregar todos os ids de resíduos das entregas
			residuos_ids = []
			for entrega in entregas:
				ids = entrega.get("residuos_id") or entrega.get("residuos") or []
				for rid in ids:
					if rid not in residuos_ids:
						residuos_ids.append(rid)

			# Buscar documentos completos dos resíduos
			residuos = []
			for rid in residuos_ids:
				res = await residue_repo.find_by_id(rid)
				if res:
					residuos.append(res)

			# Agrupar por tipo de categoria e somar quantidade (como no caso do produtor)
			category_sums: Dict[str, float] = {}
			for r in residuos:
				categoria_id = r.get("categoriaId")
				categoria_doc = None
				if categoria_id:
					categoria_doc = await categoria_repo.buscar_por_id(str(categoria_id))
				cat_tipo = categoria_doc.get("tipo") if categoria_doc else str(categoria_id)
				quant = r.get("quantidade", 0) or 0
				try:
					quant = float(quant)
				except Exception:
					quant = 0.0
				category_sums[cat_tipo] = category_sums.get(cat_tipo, 0.0) + quant

			result = [{"categoria": k, "quantidade": v} for k, v in category_sums.items()]

			# Retornar agregado por categoria e lista de resíduos
			return {"by_category": result, "residuos": residuos}

	@staticmethod
	async def update_user(user_id: str, payload: UserUpdate) -> UserPublic:
		"""
		Atualiza dados de um usuário utilizando User Builders.
		
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
		
		# Carregar builder com dados existentes
		builder = get_user_builder(user)
		
		# Preparar updates
		updates = payload.model_dump(exclude_unset=True)
		
		# Aplicar updates ao builder
		if "name" in updates:
			builder.with_name(updates["name"])
		
		if "email" in updates:
			# Verificar unicidade de email
			if updates["email"] != user["email"]:
				existing = await user_repo.find_by_email(updates["email"])
				if existing:
					raise HTTPException(
						status_code=status.HTTP_409_CONFLICT,
						detail="E-mail já cadastrado por outro usuário."
					)
			builder.with_email(updates["email"])
		
		if "phone" in updates:
			builder.with_phone(updates["phone"])
		
		if "password" in updates:
			builder.with_password(updates["password"])
		
		if "cidade_id" in updates:
			builder.with_cidade_id(updates["cidade_id"])
		
		if "estado_id" in updates:
			builder.with_estado_id(updates["estado_id"])
		
		# Campos específicos de produtor
		if "is_business" in updates:
			builder.with_is_business(updates["is_business"])
		
		if "cnpj" in updates:
			builder.with_cnpj(updates["cnpj"])
		
		if "points" in updates:
			builder.with_points(updates["points"])
		
		if "ranking" in updates:
			builder.with_ranking(updates["ranking"])
		
		# Campos específicos de coletor
		if "inventory" in updates:
			builder.with_inventory(updates["inventory"])
		
		# Campos específicos de receptor
		if "accepted_material" in updates:
			builder.with_accepted_material(updates["accepted_material"])
		
		# Construir documento atualizado
		try:
			doc = builder.build_for_db()
		except ValueError as e:
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail=f"Validação falhou: {str(e)}"
			)
		
		# Atualizar usuário no banco
		success = await user_repo.update_user(user_id, doc)
		if not success:
			raise HTTPException(
				status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
				detail="Falha ao atualizar usuário."
			)
		
		# Recuperar usuário atualizado
		updated = await user_repo.find_by_id(user_id)
		builder = get_user_builder(updated)
		return builder.build_public()

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
