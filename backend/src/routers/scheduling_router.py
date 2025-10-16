from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.schemas.scheduling_schema import (
    SchedulingCreate,
    SchedulingUpdate,
    SchedulingInDB,
)
from src.service.scheduling_service import SchedulingService
from src.infra.security.dependencies import get_current_user


router = APIRouter(
    prefix="/schedules",
    tags=["Agendamentos"],
    responses={
        401: {"description": "Não autenticado"},
        403: {"description": "Sem permissão"},
        404: {"description": "Agendamento não encontrado"},
    },
)

scheduling_service = SchedulingService()


@router.post(
    "/",
    response_model=SchedulingInDB,
    status_code=status.HTTP_201_CREATED,
    summary="Criar novo agendamento",
)
async def criar_agendamento(
    dados: SchedulingCreate,
    current_user: dict = Depends(get_current_user),
) -> SchedulingInDB:
    """
    Cria um novo agendamento de coleta.

    Regras sugeridas:
    - Apenas produtores podem criar (se desejar, valide role_id == "produtor")
    - Evita duplicidade de PENDENTE por resíduo (feito no service)
    """
    return await scheduling_service.criar_agendamento(dados)


@router.get(
    "/{scheduling_id}",
    response_model=SchedulingInDB,
    summary="Obter agendamento por ID",
)
async def obter_agendamento(
    scheduling_id: str,
    current_user: dict = Depends(get_current_user),
) -> SchedulingInDB:
    return await scheduling_service.obter_agendamento(scheduling_id)


@router.get(
    "/",
    response_model=List[SchedulingInDB],
    summary="Listar agendamentos",
)
async def listar_agendamentos(
    produtorId: Optional[str] = Query(None),
    residuoId: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
) -> List[SchedulingInDB]:
    return await scheduling_service.listar_agendamentos(
        produtorId=produtorId,
        residuoId=residuoId,
        status=status,
        limit=limit,
        skip=skip,
    )


@router.patch(
    "/{scheduling_id}",
    response_model=SchedulingInDB,
    summary="Atualizar agendamento",
)
async def atualizar_agendamento(
    scheduling_id: str,
    dados: SchedulingUpdate,
    current_user: dict = Depends(get_current_user),
) -> SchedulingInDB:
    return await scheduling_service.atualizar_agendamento(scheduling_id, dados)


@router.patch(
    "/{scheduling_id}/status",
    response_model=SchedulingInDB,
    summary="Atualizar status do agendamento",
)
async def atualizar_status(
    scheduling_id: str,
    body: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
) -> SchedulingInDB:
    new_status = body.get("status")
    if not new_status:
        raise HTTPException(400, "Campo 'status' é obrigatório")
    return await scheduling_service.atualizar_status(scheduling_id, new_status)


@router.delete(
    "/{scheduling_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar agendamento",
)
async def deletar_agendamento(
    scheduling_id: str,
    current_user: dict = Depends(get_current_user),
) -> None:
    await scheduling_service.deletar_agendamento(scheduling_id)
    return None