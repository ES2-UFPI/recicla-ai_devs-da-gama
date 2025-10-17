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

    Regras:
    - Requer autenticação (token JWT via cookie)
    - O produtorId é obtido automaticamente do usuário autenticado
    - Apenas produtores podem criar agendamentos
    - Evita duplicidade de agendamento PENDENTE por resíduo
    """
    # Opcional: Validar se o usuário é produtor
    if current_user.get("role_id") != "produtor":
        raise HTTPException(403, "Apenas produtores podem criar agendamentos")
    
    produtor_id = current_user.get("id")
    if not produtor_id:
        raise HTTPException(401, "Usuário não autenticado corretamente")
    
    return await scheduling_service.criar_agendamento(dados, produtor_id)


@router.get(
    "/{scheduling_id}",
    response_model=SchedulingInDB,
    summary="Obter agendamento por ID",
)
async def obter_agendamento(
    scheduling_id: str,
    current_user: dict = Depends(get_current_user),
) -> SchedulingInDB:
    """
    Obtém um agendamento específico por ID.
    
    Regras de autorização:
    - Produtor: pode ver apenas seus próprios agendamentos
    - Cooperativa/Reciclador: pode ver qualquer agendamento (para aceitar coletas)
    """
    return await scheduling_service.obter_agendamento(scheduling_id, current_user)


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
    """
    Lista agendamentos com filtros opcionais.
    
    Regras de autorização:
    - Produtor: lista apenas seus próprios agendamentos (filtro produtorId é ignorado)
    - Cooperativa/Reciclador: lista todos os agendamentos disponíveis
    """
    return await scheduling_service.listar_agendamentos(
        produtorId=produtorId,
        residuoId=residuoId,
        status=status,
        limit=limit,
        skip=skip,
        current_user=current_user,
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
    """
    Atualiza dados do agendamento.
    
    Regras de autorização:
    - Produtor: pode editar apenas seus próprios agendamentos
    - Cooperativa/Reciclador: NÃO pode editar (apenas atualizar status)
    """
    return await scheduling_service.atualizar_agendamento(scheduling_id, dados, current_user)


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
    """
    Atualiza apenas o status do agendamento.
    
    Regras de autorização:
    - Produtor: pode atualizar status dos próprios agendamentos
    - Cooperativa/Reciclador: pode atualizar status de qualquer agendamento
    """
    new_status = body.get("status")
    if not new_status:
        raise HTTPException(400, "Campo 'status' é obrigatório")
    return await scheduling_service.atualizar_status(scheduling_id, new_status, current_user)


@router.delete(
    "/{scheduling_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar agendamento",
)
async def deletar_agendamento(
    scheduling_id: str,
    current_user: dict = Depends(get_current_user),
) -> None:
    """
    Deleta um agendamento.
    
    Regras de autorização:
    - Produtor: pode deletar apenas seus próprios agendamentos
    - Cooperativa/Reciclador: NÃO pode deletar agendamentos
    """
    await scheduling_service.deletar_agendamento(scheduling_id, current_user)
    return None