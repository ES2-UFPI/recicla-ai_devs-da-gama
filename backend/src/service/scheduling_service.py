from typing import Any, Dict, List, Optional
from fastapi import HTTPException

from src.infra.database.repositories import scheduling_repo, user_repo, residue_repo
from src.infra.database.models.scheduling import Scheduling
from src.schemas.scheduling_schema import (
    SchedulingCreate,
    SchedulingUpdate,
    SchedulingInDB,
    LocalEndereco,
)


class SchedulingService:
    """
    Camada de serviço responsável por CRUD de agendamentos.
    """

    async def _buscar_endereco_produtor(self, produtor_id: str, address_id: int) -> Dict[str, Any]:
        """
        Busca o endereço completo do produtor pelo ID.
        
        Args:
            produtor_id: ID do produtor
            address_id: ID do endereço no array de addresses do produtor
        
        Returns:
            Dict com os dados do endereço
            
        Raises:
            HTTPException: Se produtor ou endereço não encontrado
        """
        # Buscar usuário produtor
        usuario = await user_repo.find_by_id(produtor_id)
        if not usuario:
            raise HTTPException(404, "Produtor não encontrado")
        
        # Buscar endereço específico
        addresses = usuario.get("addresses", [])
        endereco = next((addr for addr in addresses if addr.get("id") == address_id), None)
        
        if not endereco:
            raise HTTPException(
                404, 
                f"Endereço com ID {address_id} não encontrado no perfil do produtor"
            )
        
        # Montar objeto LocalEndereco
        return {
            "address_id": endereco.get("id"),
            "apelido": endereco.get("apelido"),
            "cep": endereco.get("cep"),
            "logradouro": endereco.get("logradouro"),
            "numero": endereco.get("numero"),
            "complemento": endereco.get("complemento"),
            "latitude": endereco.get("latitude"),
            "longitude": endereco.get("longitude"),
        }

    async def criar_agendamento(self, dados: SchedulingCreate, produtor_id: str) -> SchedulingInDB:
        """
        Cria um novo agendamento.

        Args:
            dados: Dados do agendamento (sem produtorId, com address_id)
            produtor_id: ID do usuário autenticado

        Regras:
        - Define status padrão (PENDENTE) via model
        - Evita duplicidade de PENDENTE por resíduo
        - produtorId é obtido automaticamente do usuário autenticado
        - Valida slots de disponibilidade (horários e datas)
        - Busca endereço completo do produtor pelo address_id
        """
        # Opcional: impedir mais de um agendamento PENDENTE por resíduo
        for residuo_id in dados.residuosId:
            existente = await scheduling_repo.find_pending_for_residuo(residuo_id)
            if existente:
                raise HTTPException(409, "Já existe agendamento PENDENTE para um dos resíduos informados.")

        # Buscar endereço completo do produtor
        local_dict = await self._buscar_endereco_produtor(produtor_id, dados.address_id)
        
        # Converter slots de disponibilidade para formato de armazenamento (lista de dicts)
        disponibilidade_dicts = [slot.model_dump() for slot in dados.disponibilidade]
        
        # Monta objeto de domínio e persiste
        scheduling_obj = Scheduling(
            produtorId=produtor_id,  # Usa o ID do usuário autenticado
            residuosId=dados.residuosId,
            disponibilidade=disponibilidade_dicts,  # Armazena como lista de dicts
            local=local_dict,  # Armazena endereço completo como dict
            observacoes=dados.observacoes,
        )
        doc = scheduling_obj.model_dump(by_alias=True, exclude_none=True)
        # Remover id se vier como None para evitar problemas
        doc.pop("_id", None)

        new_id = await scheduling_repo.create_scheduling(doc)
        
        # 🔔 PADRÃO OBSERVER: Atualizar status dos resíduos para AGENDADO
        # Quando um agendamento é criado, os resíduos associados mudam de estado
        for residuo_id in dados.residuosId:
            try:
                await residue_repo.atualizar_status(
                    residuo_id=residuo_id,
                    novo_status="AGENDADO",
                    usuario_id=produtor_id,
                    detalhes={
                        "agendamento_id": new_id,
                        "acao": "agendamento_criado",
                        "produtor_id": produtor_id
                    }
                )
            except Exception as e:
                # Log do erro mas não falha a criação do agendamento
                # Em produção, usar logger adequado
                print(f"Erro ao atualizar status do resíduo {residuo_id}: {str(e)}")
        
        criado = await scheduling_repo.find_by_id(new_id)
        if not criado:
            raise HTTPException(500, "Erro ao recuperar agendamento criado")
        return SchedulingInDB(**criado)

    async def obter_agendamento(
        self, 
        scheduling_id: str, 
        current_user: Dict[str, Any]
    ) -> SchedulingInDB:
        """
        Obtém um agendamento por ID.
        
        Regras de autorização:
        - Produtor: pode ver apenas seus próprios agendamentos
        - Cooperativa/Reciclador: pode ver qualquer agendamento (para aceitar coletas)
        - Admin: pode ver qualquer agendamento
        """
        achado = await scheduling_repo.find_by_id(scheduling_id)
        if not achado:
            raise HTTPException(404, "Agendamento não encontrado")
        
        user_role = current_user.get("role_id")
        user_id = current_user.get("id")
        
        # Produtores só podem ver seus próprios agendamentos
        if user_role == "produtor" and achado.get("produtorId") != user_id:
            raise HTTPException(403, "Você só pode visualizar seus próprios agendamentos")
        
        return SchedulingInDB(**achado)

    async def listar_agendamentos(
        self,
        *,
        produtorId: Optional[str] = None,
        residuoId: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
        skip: int = 0,
        current_user: Dict[str, Any]
    ) -> List[SchedulingInDB]:
        """
        Lista agendamentos com filtros opcionais.
        
        Regras de autorização:
        - Produtor: lista apenas seus próprios agendamentos (ignora filtro produtorId)
        - Cooperativa/Reciclador: lista todos os agendamentos (para aceitar coletas)
        - Admin: lista todos os agendamentos
        """
        filters: Dict[str, Any] = {}
        
        user_role = current_user.get("role_id")
        user_id = current_user.get("id")
        
        # Produtores só podem listar seus próprios agendamentos
        if user_role == "produtor":
            filters["produtorId"] = user_id  # Força filtro pelo próprio ID
        else:
            # Cooperativas/Recicladores/Admin podem filtrar por produtor
            if produtorId:
                filters["produtorId"] = produtorId
        
        if residuoId:
            filters["residuosId"] = residuoId
        if status:
            filters["status"] = status

        docs = await scheduling_repo.list_schedules(filters=filters or None, limit=limit, skip=skip)
        return [SchedulingInDB(**d) for d in docs]

    async def atualizar_agendamento(
        self, 
        scheduling_id: str, 
        dados: SchedulingUpdate,
        current_user: Dict[str, Any]
    ) -> SchedulingInDB:
        """
        Atualiza campos editáveis do agendamento (residuosId, disponibilidade, local, observacoes).
        Status deve ser alterado por método dedicado (atualizar_status).
        
        Regras de autorização:
        - Produtor: pode editar apenas seus próprios agendamentos
        - Cooperativa/Reciclador: NÃO pode editar (apenas mudar status)
        - Admin: pode editar qualquer agendamento
        """
        atual = await scheduling_repo.find_by_id(scheduling_id)
        if not atual:
            raise HTTPException(404, "Agendamento não encontrado")
        
        user_role = current_user.get("role_id")
        user_id = current_user.get("id")
        
        # Cooperativas/Recicladores não podem editar agendamentos
        if user_role in ["cooperativa", "reciclador"]:
            raise HTTPException(403, "Cooperativas e recicladores não podem editar agendamentos. Use o endpoint de atualização de status.")
        
        # Produtores só podem editar seus próprios agendamentos
        if user_role == "produtor" and atual.get("produtorId") != user_id:
            raise HTTPException(403, "Você só pode editar seus próprios agendamentos")

        updates = dados.model_dump(exclude_unset=True)
        if not updates:
            return SchedulingInDB(**atual)
        
        # Converter disponibilidade para formato de armazenamento se fornecida
        if dados.disponibilidade is not None:
            updates["disponibilidade"] = [slot.model_dump() for slot in dados.disponibilidade]
        
        # Buscar novo endereço se address_id foi fornecido
        if dados.address_id is not None:
            produtor_id_agendamento = atual.get("produtorId")
            if not produtor_id_agendamento:
                raise HTTPException(500, "Agendamento sem produtorId")
            local_dict = await self._buscar_endereco_produtor(produtor_id_agendamento, dados.address_id)
            updates["local"] = local_dict

        ok = await scheduling_repo.update_scheduling(scheduling_id, updates)
        if not ok:
            raise HTTPException(500, "Erro ao atualizar agendamento")

        atualizado = await scheduling_repo.find_by_id(scheduling_id)
        if not atualizado:
            raise HTTPException(500, "Erro ao recuperar agendamento atualizado")
        return SchedulingInDB(**atualizado)

    async def atualizar_status(
        self, 
        scheduling_id: str, 
        novo_status: str,
        current_user: Dict[str, Any]
    ) -> SchedulingInDB:
        """
        Atualiza apenas o status do agendamento.
        
        Regras de autorização:
        - Produtor: pode atualizar status dos próprios agendamentos (ex: CANCELADO)
        - Cooperativa/Reciclador: pode atualizar status de qualquer agendamento (CONFIRMADO, EM_ANDAMENTO, CONCLUÍDO)
        - Admin: pode atualizar status de qualquer agendamento
        """
        atual = await scheduling_repo.find_by_id(scheduling_id)
        if not atual:
            raise HTTPException(404, "Agendamento não encontrado")
        
        user_role = current_user.get("role_id")
        user_id = current_user.get("id")
        
        # Produtores só podem atualizar status dos próprios agendamentos
        if user_role == "produtor" and atual.get("produtorId") != user_id:
            raise HTTPException(403, "Você só pode atualizar o status dos seus próprios agendamentos")

        ok = await scheduling_repo.update_status(scheduling_id, novo_status)
        if not ok:
            raise HTTPException(500, "Erro ao atualizar status do agendamento")

        # 🔔 PADRÃO OBSERVER: Atualizar status dos resíduos quando agendamento é cancelado
        # Se o agendamento foi CANCELADO, os resíduos voltam para DISPONIVEL
        if novo_status.upper() == "CANCELADO":
            residuos_ids = atual.get("residuosId", [])
            for residuo_id in residuos_ids:
                try:
                    await residue_repo.atualizar_status(
                        residuo_id=residuo_id,
                        novo_status="DISPONIVEL",
                        usuario_id=str(user_id) if user_id else "sistema",
                        detalhes={
                            "agendamento_id": scheduling_id,
                            "acao": "agendamento_cancelado",
                            "usuario_id": str(user_id) if user_id else "sistema"
                        }
                    )
                except Exception as e:
                    print(f"Erro ao atualizar status do resíduo {residuo_id}: {str(e)}")

        atualizado = await scheduling_repo.find_by_id(scheduling_id)
        if not atualizado:
            raise HTTPException(500, "Erro ao recuperar agendamento atualizado")
        return SchedulingInDB(**atualizado)

    async def deletar_agendamento(
        self, 
        scheduling_id: str,
        current_user: Dict[str, Any]
    ) -> bool:
        """
        Deleta um agendamento por ID.
        
        Regras de autorização:
        - Produtor: pode deletar apenas seus próprios agendamentos
        - Cooperativa/Reciclador: NÃO pode deletar agendamentos
        - Admin: pode deletar qualquer agendamento
        """
        atual = await scheduling_repo.find_by_id(scheduling_id)
        if not atual:
            raise HTTPException(404, "Agendamento não encontrado")
        
        user_role = current_user.get("role_id")
        user_id = current_user.get("id")
        
        # Cooperativas/Recicladores não podem deletar agendamentos
        if user_role in ["cooperativa", "reciclador"]:
            raise HTTPException(403, "Cooperativas e recicladores não podem deletar agendamentos")
        
        # Produtores só podem deletar seus próprios agendamentos
        if user_role == "produtor" and atual.get("produtorId") != user_id:
            raise HTTPException(403, "Você só pode deletar seus próprios agendamentos")

        ok = await scheduling_repo.delete_scheduling(scheduling_id)
        if not ok:
            raise HTTPException(500, "Erro ao deletar agendamento")
        return True