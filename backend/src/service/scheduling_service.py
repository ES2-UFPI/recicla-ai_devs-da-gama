from typing import Any, Dict, List, Optional
from fastapi import HTTPException

from src.infra.database.repositories import scheduling_repo
from src.infra.database.models.scheduling import Scheduling
from src.schemas.scheduling_schema import (
    SchedulingCreate,
    SchedulingUpdate,
    SchedulingInDB,
)


class SchedulingService:
    """
    Camada de serviço responsável por CRUD de agendamentos.
    """

    async def criar_agendamento(self, dados: SchedulingCreate) -> SchedulingInDB:
        """
        Cria um novo agendamento.

        Regras:
        - Define status padrão (PENDENTE) via model
        - Opcional: evitar duplicidade de PENDENTE por resíduo
        """
        # Opcional: impedir mais de um agendamento PENDENTE por resíduo
        for residuo_id in dados.residuosId:
            existente = await scheduling_repo.find_pending_for_residuo(residuo_id)
            if existente:
                raise HTTPException(409, "Já existe agendamento PENDENTE para um dos resíduos informados.")

        # Monta objeto de domínio e persiste
        scheduling_obj = Scheduling(
            produtorId=dados.produtorId,
            residuosId=dados.residuosId,
            disponibilidade=dados.disponibilidade,
            local=dados.local,
            observacoes=dados.observacoes,
        )
        doc = scheduling_obj.model_dump(by_alias=True, exclude_none=True)
        # Remover id se vier como None para evitar problemas
        doc.pop("_id", None)

        new_id = await scheduling_repo.create_scheduling(doc)
        criado = await scheduling_repo.find_by_id(new_id)
        if not criado:
            raise HTTPException(500, "Erro ao recuperar agendamento criado")
        return SchedulingInDB(**criado)

    async def obter_agendamento(self, scheduling_id: str) -> SchedulingInDB:
        """Obtém um agendamento por ID."""
        achado = await scheduling_repo.find_by_id(scheduling_id)
        if not achado:
            raise HTTPException(404, "Agendamento não encontrado")
        return SchedulingInDB(**achado)

    async def listar_agendamentos(
        self,
        *,
        produtorId: Optional[str] = None,
        residuoId: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
        skip: int = 0,
    ) -> List[SchedulingInDB]:
        """Lista agendamentos com filtros opcionais."""
        filters: Dict[str, Any] = {}
        if produtorId:
            filters["produtorId"] = produtorId
        if residuoId:
            filters["residuosId"] = residuoId
        if status:
            filters["status"] = status

        docs = await scheduling_repo.list_schedules(filters=filters or None, limit=limit, skip=skip)
        return [SchedulingInDB(**d) for d in docs]

    async def atualizar_agendamento(self, scheduling_id: str, dados: SchedulingUpdate) -> SchedulingInDB:
        """
        Atualiza campos editáveis do agendamento (produtorId, residuosId, disponibilidade, local, observacoes).
        Status deve ser alterado por método dedicado (atualizar_status).
        """
        atual = await scheduling_repo.find_by_id(scheduling_id)
        if not atual:
            raise HTTPException(404, "Agendamento não encontrado")

        updates = dados.model_dump(exclude_unset=True)
        if not updates:
            return SchedulingInDB(**atual)

        ok = await scheduling_repo.update_scheduling(scheduling_id, updates)
        if not ok:
            raise HTTPException(500, "Erro ao atualizar agendamento")

        atualizado = await scheduling_repo.find_by_id(scheduling_id)
        if not atualizado:
            raise HTTPException(500, "Erro ao recuperar agendamento atualizado")
        return SchedulingInDB(**atualizado)

    async def atualizar_status(self, scheduling_id: str, novo_status: str) -> SchedulingInDB:
        """Atualiza apenas o status do agendamento."""
        atual = await scheduling_repo.find_by_id(scheduling_id)
        if not atual:
            raise HTTPException(404, "Agendamento não encontrado")

        ok = await scheduling_repo.update_status(scheduling_id, novo_status)
        if not ok:
            raise HTTPException(500, "Erro ao atualizar status do agendamento")

        atualizado = await scheduling_repo.find_by_id(scheduling_id)
        if not atualizado:
            raise HTTPException(500, "Erro ao recuperar agendamento atualizado")
        return SchedulingInDB(**atualizado)

    async def deletar_agendamento(self, scheduling_id: str) -> bool:
        """Deleta um agendamento por ID."""
        atual = await scheduling_repo.find_by_id(scheduling_id)
        if not atual:
            raise HTTPException(404, "Agendamento não encontrado")

        ok = await scheduling_repo.delete_scheduling(scheduling_id)
        if not ok:
            raise HTTPException(500, "Erro ao deletar agendamento")
        return True