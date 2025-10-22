from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from src.schemas.coleta_schema import ColetaInDBSchema
from src.service.coleta_service import ColetaService
from src.infra.security.dependencies import get_current_user


router = APIRouter(
    prefix="/coletas",
    tags=["Coletas"],
    responses={
        401: {"description": "Não autenticado"},
        403: {"description": "Sem permissão"},
        404: {"description": "Recurso não encontrado"},
    },
)

coleta_service = ColetaService()


# ======== Request DTOs (mínimos necessários para os endpoints) ========

class AceitarColetaRequest(BaseModel):
    agendamento_id: str = Field(..., description="ID do agendamento")
    residuos_ids: List[str] = Field(..., description="Lista de IDs dos resíduos a reservar")


class ColetarResiduoRequest(BaseModel):
    residuo_id: str = Field(..., description="ID do resíduo a marcar como coletado")
    observacao: Optional[str] = Field(None, description="Observação opcional")


class RejeitarResiduoRequest(BaseModel):
    residuo_id: str = Field(..., description="ID do resíduo a rejeitar")
    motivo: str = Field(..., min_length=3, description="Motivo da rejeição")


class CancelamentoRequest(BaseModel):
    motivo: Optional[str] = Field(None, description="Motivo do cancelamento")


# ======== Endpoints ========

@router.post(
    "/aceitar",
    response_model=ColetaInDBSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Aceitar coleta (reservar resíduos)",
    description="Coletor aceita um agendamento selecionando resíduos para reservar.",
)
async def aceitar_coleta(
    body: AceitarColetaRequest,
    current_user: dict = Depends(get_current_user),
) -> ColetaInDBSchema:
    # Apenas coletores podem aceitar coleta
    if current_user.get("role_id") != "coletor":
        raise HTTPException(403, "Apenas coletores podem aceitar coletas")

    return await coleta_service.aceitar_coleta(
        agendamento_id=body.agendamento_id,
        residuos_ids=body.residuos_ids,
        coletor_id=current_user.get("id"),
    )


@router.patch(
    "/{coleta_id}/iniciar",
    response_model=ColetaInDBSchema,
    summary="Iniciar coleta no local",
    description="Marca a coleta como EM_ANDAMENTO (coletor chegou no local).",
)
async def iniciar_coleta(
    coleta_id: str,
    current_user: dict = Depends(get_current_user),
) -> ColetaInDBSchema:
    if current_user.get("role_id") != "coletor":
        raise HTTPException(403, "Apenas coletores podem iniciar coletas")
    return await coleta_service.iniciar_coleta(coleta_id, current_user.get("id"))


@router.patch(
    "/{coleta_id}/coletar-residuo",
    response_model=ColetaInDBSchema,
    summary="Coletar um resíduo",
    description="Marca um resíduo da coleta como COLETADO (mantém na lista).",
)
async def coletar_residuo(
    coleta_id: str,
    body: ColetarResiduoRequest,
    current_user: dict = Depends(get_current_user),
) -> ColetaInDBSchema:
    if current_user.get("role_id") != "coletor":
        raise HTTPException(403, "Apenas coletores podem coletar resíduos")
    return await coleta_service.coletar_residuo(
        coleta_id=coleta_id,
        residuo_id=body.residuo_id,
        coletor_id=current_user.get("id"),
        observacao=body.observacao,
    )


@router.patch(
    "/{coleta_id}/rejeitar-residuo",
    response_model=ColetaInDBSchema,
    summary="Rejeitar um resíduo",
    description="Marca um resíduo da coleta como REJEITADO e remove da lista.",
)
async def rejeitar_residuo(
    coleta_id: str,
    body: RejeitarResiduoRequest,
    current_user: dict = Depends(get_current_user),
) -> ColetaInDBSchema:
    if current_user.get("role_id") != "coletor":
        raise HTTPException(403, "Apenas coletores podem rejeitar resíduos")
    return await coleta_service.rejeitar_residuo(
        coleta_id=coleta_id,
        residuo_id=body.residuo_id,
        coletor_id=current_user.get("id"),
        motivo=body.motivo,
    )


@router.post(
    "/{coleta_id}/cancelar-antes-local",
    response_model=ColetaInDBSchema,
    summary="Cancelar coleta antes de chegar ao local",
    description="Cancela coleta PENDENTE e libera resíduos (RESERVADO -> AGENDADO)",
)
async def cancelar_antes_local(
    coleta_id: str,
    body: CancelamentoRequest,
    current_user: dict = Depends(get_current_user),
) -> ColetaInDBSchema:
    if current_user.get("role_id") != "coletor":
        raise HTTPException(403, "Apenas coletores podem cancelar coletas")
    return await coleta_service.cancelar_coleta_antes_local(
        coleta_id=coleta_id,
        coletor_id=current_user.get("id"),
        motivo=body.motivo or "",
    )


@router.post(
    "/{coleta_id}/cancelar",
    response_model=ColetaInDBSchema,
    summary="Cancelar coleta após chegar ao local",
    description="Cancela coleta EM_ANDAMENTO e marca resíduos ainda RESERVADO como CANCELADO",
)
async def cancelar_apos_local(
    coleta_id: str,
    body: CancelamentoRequest,
    current_user: dict = Depends(get_current_user),
) -> ColetaInDBSchema:
    if current_user.get("role_id") != "coletor":
        raise HTTPException(403, "Apenas coletores podem cancelar coletas")
    return await coleta_service.cancelar_coleta_apos_local(
        coleta_id=coleta_id,
        coletor_id=current_user.get("id"),
        motivo=body.motivo or "",
    )


@router.get(
    "/minhas",
    response_model=List[ColetaInDBSchema],
    summary="Listar minhas coletas",
    description="Lista coletas do coletor autenticado, com filtro opcional por estado.",
)
async def listar_minhas_coletas(
    estado: Optional[str] = Query(None, description="Filtrar por estado da coleta"),
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
) -> List[ColetaInDBSchema]:
    if current_user.get("role_id") != "coletor":
        raise HTTPException(403, "Apenas coletores podem listar coletas")
    return await coleta_service.listar_coletas_coletor(
        coletor_id=current_user.get("id"),
        estado=estado,
        limit=limit,
        skip=skip,
    )


@router.get(
    "/{coleta_id}",
    response_model=ColetaInDBSchema,
    summary="Obter detalhes de uma coleta",
)
async def obter_coleta(
    coleta_id: str,
    current_user: dict = Depends(get_current_user),
) -> ColetaInDBSchema:
    if current_user.get("role_id") != "coletor":
        raise HTTPException(403, "Apenas coletores podem acessar coletas")
    return await coleta_service.buscar_coleta(coleta_id, current_user.get("id"))
