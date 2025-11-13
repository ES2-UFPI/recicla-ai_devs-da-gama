"""
Router de Entregas - Endpoints para gerenciar entregas de resíduos.

Permite que coletores:
- Registrem entregas de resíduos para receptoras (ecopontos)
- Listem suas entregas realizadas
- Obtenham estatísticas agregadas de entregas por categoria
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query

from src.schemas.entrega_schema import (
    EntregaCreate,
    EntregaResponse,
    EntregaSumario,
)
from src.service.entrega_service import EntregaService
from src.infra.security.dependencies import get_current_user


router = APIRouter(
    prefix="/entregas",
    tags=["Entregas"],
    responses={
        401: {"description": "Não autenticado"},
        403: {"description": "Sem permissão"},
        404: {"description": "Recurso não encontrado"},
    },
)


# ==================== ENDPOINTS ====================

@router.post(
    "",
    response_model=EntregaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar entrega de resíduos",
    description="""
    Registra uma entrega de resíduos do coletor para uma receptora (ecoponto).
    
    Fluxo:
    1. Valida que o coletor tem os resíduos no inventário
    2. Valida que os resíduos estão com status COLETADO
    3. Valida que a receptora existe
    4. Cria registro da entrega
    5. Atualiza status dos resíduos para ENTREGUE
    6. Remove resíduos do inventário do coletor
    
    Apenas coletores autenticados podem criar entregas.
    """,
)
async def criar_entrega(
    body: EntregaCreate,
    current_user: dict = Depends(get_current_user),
) -> EntregaResponse:
    """
    Cria uma nova entrega de resíduos para uma receptora.
    
    Args:
        body: Dados da entrega (receptora_id, residuos_id, observacoes)
        current_user: Usuário autenticado (injetado automaticamente)
    
    Returns:
        EntregaResponse: Dados completos da entrega criada
    
    Raises:
        HTTPException 403: Se usuário não for coletor
        HTTPException 404: Se coletor, receptora ou resíduo não existir
        HTTPException 400: Se validação falhar (resíduo não no inventory, status inválido, etc)
    """
    # Validar que apenas coletores podem criar entregas
    if current_user.get("role_id") != "coletor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas coletores podem criar entregas"
        )
    
    coletor_id = current_user.get("id")
    if not isinstance(coletor_id, str) or not coletor_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não autenticado ou ID inválido"
        )
    
    return await EntregaService.criar_entrega(
        coletor_id=coletor_id,
        entrega_payload=body
    )


@router.get(
    "",
    response_model=List[EntregaResponse],
    summary="Listar entregas do coletor",
    description="""
    Lista todas as entregas realizadas pelo coletor autenticado.
    
    Suporta paginação via query parameters skip e limit.
    As entregas são ordenadas por data (mais recentes primeiro).
    
    Apenas coletores autenticados podem listar suas entregas.
    """,
)
async def listar_entregas(
    current_user: dict = Depends(get_current_user),
    skip: int = Query(0, ge=0, description="Número de registros a pular (paginação)"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
) -> List[EntregaResponse]:
    """
    Lista entregas do coletor autenticado com paginação.
    
    Args:
        current_user: Usuário autenticado (injetado automaticamente)
        skip: Quantidade de registros a pular (padrão: 0)
        limit: Quantidade máxima de registros (padrão: 100, máximo: 1000)
    
    Returns:
        List[EntregaResponse]: Lista de entregas do coletor
    
    Raises:
        HTTPException 403: Se usuário não for coletor
    """
    # Validar que apenas coletores podem listar suas entregas
    if current_user.get("role_id") != "coletor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas coletores podem listar entregas"
        )
    
    coletor_id = current_user.get("id")
    if not isinstance(coletor_id, str) or not coletor_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não autenticado ou ID inválido"
        )
    
    return await EntregaService.listar_entregas_coletor(
        coletor_id=coletor_id,
        skip=skip,
        limit=limit
    )


@router.get(
    "/sumario",
    response_model=List[EntregaSumario],
    summary="Obter sumário de entregas por categoria",
    description="""
    Retorna estatísticas agregadas das entregas do coletor.
    
    Agrupa todas as entregas por:
    - Categoria do resíduo (categoriaId)
    - Tipo de medida (kg, unidade, litro, etc)
    
    E soma as quantidades totais entregues.
    
    Exemplo de resposta:
    ```json
    [
        {
            "categoriaId": "plastico",
            "tipo_medida": "kg",
            "quantidade_total": 150.5
        },
        {
            "categoriaId": "papel",
            "tipo_medida": "unidade",
            "quantidade_total": 75.0
        }
    ]
    ```
    
    Útil para dashboards e relatórios de impacto ambiental.
    Apenas coletores autenticados podem acessar.
    """,
)
async def obter_sumario_entregas(
    current_user: dict = Depends(get_current_user),
) -> List[EntregaSumario]:
    """
    Obtém sumarização das entregas por categoria e tipo de medida.
    
    Args:
        current_user: Usuário autenticado (injetado automaticamente)
    
    Returns:
        List[EntregaSumario]: Lista de sumarizações com quantidade total por categoria
    
    Raises:
        HTTPException 403: Se usuário não for coletor
    """
    # Validar que apenas coletores podem ver sumário de suas entregas
    if current_user.get("role_id") != "coletor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas coletores podem acessar sumário de entregas"
        )
    
    coletor_id = current_user.get("id")
    if not isinstance(coletor_id, str) or not coletor_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não autenticado ou ID inválido"
        )
    
    return await EntregaService.obter_sumario_entregas(coletor_id=coletor_id)
