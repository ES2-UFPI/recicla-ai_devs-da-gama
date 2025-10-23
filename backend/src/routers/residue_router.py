"""
Router de Resíduos - Endpoints REST para operações com resíduos.

Este router expõe as funcionalidades do ResiduoService através de endpoints HTTP.
Todos os endpoints requerem autenticação (JWT).

Endpoints disponíveis:
- POST   /residuos              - Criar resíduo (produtor)
- GET    /residuos/meus-residuos - Listar meus resíduos (produtor)
- GET    /residuos/{id}          - Obter detalhes (produtor dono)
- PUT    /residuos/{id}          - Atualizar resíduo (produtor dono)
- DELETE /residuos/{id}          - Deletar resíduo (produtor dono)
- GET    /residuos/{id}/historico - Ver histórico completo
- PATCH  /residuos/{id}/status   - Atualizar status (logística)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List

from src.schemas.residue_schema import (
    ResidueCreate, 
    ResidueResponse, 
    ResidueUpdate,
    ResidueStatusUpdate,
    HistoricoResiduoResponse
)
from src.service.residuo_service import ResiduoService
from src.infra.security.dependencies import get_current_user

# Inicializar router e service
router = APIRouter(
    prefix="/residuos",
    tags=["Resíduos"],
    responses={
        401: {"description": "Não autenticado"},
        403: {"description": "Sem permissão"},
        404: {"description": "Resíduo não encontrado"}
    }
)

# Instância do service (pode ser injetada via dependency injection futuramente)
residuo_service = ResiduoService()


@router.post(
    "/",
    response_model=ResidueResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar novo resíduo",
    description="""
    Cria um novo resíduo reciclável no sistema.
    
    **Apenas PRODUTORES podem criar resíduos.**
    
    O sistema irá:
    1. Validar se a categoria existe e está ativa
    2. Calcular automaticamente o valor estimado (quantidade × preço da categoria)
    3. Criar o resíduo com status DISPONIVEL
    4. Registrar o evento CRIADO no histórico
    
    O `produtorId` é automaticamente obtido do token JWT (não precisa enviar).
    """
)
async def criar_residuo(
    dados: ResidueCreate,
    current_user: dict = Depends(get_current_user)
) -> ResidueResponse:
    """
    Cria novo resíduo.
    
    Args:
        dados: Dados do resíduo (quantidade, foto, categoriaId)
        current_user: Usuário autenticado (injetado automaticamente)
    
    Returns:
        ResidueResponse: Resíduo criado com todos os dados
    
    Raises:
        HTTPException 403: Se usuário não for produtor
        HTTPException 404: Se categoria não existir
        HTTPException 400: Se categoria estiver inativa
    """
    # Validar papel do usuário
    if current_user.get("role_id") != "produtor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas produtores podem criar resíduos"
        )
    
    # Delegar para o service
    return await residuo_service.criar_residuo(
        produtor_id=current_user.get("id"),
        dados=dados
    )


@router.get(
    "/meus-residuos",
    response_model=List[ResidueResponse],
    summary="Listar meus resíduos",
    description="""
    Lista todos os resíduos cadastrados pelo produtor autenticado.
    
    Retorna resíduos em ordem decrescente de data de cadastro (mais recentes primeiro).
    Suporta paginação via parâmetros `skip` e `limit`.
    """
)
async def listar_meus_residuos(
    skip: int = Query(0, ge=0, description="Quantidade de registros a pular"),
    limit: int = Query(100, ge=1, le=500, description="Quantidade máxima de registros"),
    current_user: dict = Depends(get_current_user)
) -> List[ResidueResponse]:
    """
    Lista resíduos do produtor autenticado.
    
    Args:
        skip: Paginação - registros a pular
        limit: Paginação - máximo de registros
        current_user: Usuário autenticado
    
    Returns:
        List[ResidueResponse]: Lista de resíduos do produtor
    """
    return await residuo_service.listar_meus_residuos(
        produtor_id=current_user.get("id"),
        skip=skip,
        limit=limit
    )


@router.get(
    "/coletor/{residuo_id}",
    response_model=ResidueResponse,
    summary="Obter detalhes de um resíduo (coletor)",
    description="""
    Retorna os detalhes completos de um resíduo específico.
    
    **Apenas COLETORES podem acessar este endpoint.**
    
    Este endpoint permite que coletores visualizem informações de qualquer resíduo
    para fins de planejamento e execução de coletas.
    """
)
async def obter_residuo_coletor(
    residuo_id: str,
    current_user: dict = Depends(get_current_user)
) -> ResidueResponse:
    """
    Obtém detalhes de um resíduo (endpoint para coletores).
    
    Args:
        residuo_id: ID do resíduo
        current_user: Usuário autenticado
    
    Returns:
        ResidueResponse: Dados completos do resíduo
    
    Raises:
        HTTPException 403: Usuário não é coletor
        HTTPException 404: Resíduo não encontrado
    """
    # Validar papel do usuário
    if current_user.get("role_id") != "coletor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas coletores podem acessar este endpoint"
        )
    
    return await residuo_service.obter_residuo_coletor(residuo_id=residuo_id)


@router.get(
    "/{residuo_id}",
    response_model=ResidueResponse,
    summary="Obter detalhes de um resíduo",
    description="""
    Retorna os detalhes completos de um resíduo específico.
    
    **Apenas o produtor dono pode acessar.**
    """
)
async def obter_residuo(
    residuo_id: str,
    current_user: dict = Depends(get_current_user)
) -> ResidueResponse:
    """
    Obtém detalhes de um resíduo.
    
    Args:
        residuo_id: ID do resíduo
        current_user: Usuário autenticado
    
    Returns:
        ResidueResponse: Dados completos do resíduo
    
    Raises:
        HTTPException 404: Resíduo não encontrado
        HTTPException 403: Usuário não é o dono
    """
    return await residuo_service.obter_residuo(
        residuo_id=residuo_id,
        produtor_id=current_user.get("id")
    )


@router.put(
    "/{residuo_id}",
    response_model=ResidueResponse,
    summary="Atualizar resíduo",
    description="""
    Atualiza os dados de um resíduo.
    
    **Apenas o produtor dono pode atualizar.**
    
    Campos que podem ser atualizados:
    - `quantidade`: Nova quantidade em kg (recalcula valor estimado)
    - `foto`: Nova URL da foto
    - `categoriaId`: Nova categoria (recalcula valor estimado)
    
    Todos os campos são opcionais. Envie apenas o que deseja alterar.
    
    O sistema registra a mudança no histórico automaticamente.
    """
)
async def atualizar_residuo(
    residuo_id: str,
    dados: ResidueUpdate,
    current_user: dict = Depends(get_current_user)
) -> ResidueResponse:
    """
    Atualiza dados de um resíduo.
    
    Args:
        residuo_id: ID do resíduo
        dados: Novos dados (campos opcionais)
        current_user: Usuário autenticado
    
    Returns:
        ResidueResponse: Resíduo atualizado
    
    Raises:
        HTTPException 404: Resíduo não encontrado
        HTTPException 403: Usuário não é o dono
    """
    return await residuo_service.atualizar_residuo(
        residuo_id=residuo_id,
        produtor_id=current_user.get("id"),
        dados=dados
    )


@router.delete(
    "/{residuo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar resíduo",
    description="""
    Deleta um resíduo do sistema.
    
    **Apenas o produtor dono pode deletar.**
    
    **ATENÇÃO:** Não é possível deletar resíduos que já foram:
    - COLETADOS
    - ENTREGUES
    
    Isso garante a integridade do histórico e das métricas.
    """
)
async def deletar_residuo(
    residuo_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Deleta um resíduo.
    
    Args:
        residuo_id: ID do resíduo
        current_user: Usuário autenticado
    
    Returns:
        None (status 204 - No Content)
    
    Raises:
        HTTPException 404: Resíduo não encontrado
        HTTPException 403: Usuário não é o dono
        HTTPException 400: Resíduo já foi coletado/entregue
    """
    await residuo_service.deletar_residuo(
        residuo_id=residuo_id,
        produtor_id=current_user.get("id")
    )
    return None


@router.get(
    "/{residuo_id}/historico",
    response_model=List[HistoricoResiduoResponse],
    summary="Obter histórico do resíduo",
    description="""
    Retorna a linha do tempo completa de um resíduo.
    
    Mostra todas as ações realizadas:
    - CRIADO: Quando o resíduo foi cadastrado
    - AGENDADO: Quando uma coleta foi agendada
    - COLETADO: Quando o coletor retirou o resíduo
    - ENTREGUE: Quando foi entregue na receptora
    - ATUALIZADO: Quando dados foram modificados
    - CANCELADO: Se houve cancelamento
    
    **Apenas o produtor dono pode acessar.**
    """
)
async def obter_historico(
    residuo_id: str,
    current_user: dict = Depends(get_current_user)
) -> List[HistoricoResiduoResponse]:
    """
    Retorna histórico completo do resíduo.
    
    Args:
        residuo_id: ID do resíduo
        current_user: Usuário autenticado
    
    Returns:
        List[HistoricoResiduoResponse]: Lista ordenada de eventos
    
    Raises:
        HTTPException 404: Resíduo não encontrado
        HTTPException 403: Usuário não tem acesso
    """
    return await residuo_service.obter_historico(
        residuo_id=residuo_id,
        produtor_id=current_user.get("id")
    )


@router.patch(
    "/{residuo_id}/status",
    response_model=ResidueResponse,
    summary="Atualizar status do resíduo",
    description="""
    Atualiza apenas o status de um resíduo.
    
    **Este endpoint é usado principalmente pelo módulo de LOGÍSTICA.**
    
    Transições válidas:
    - DISPONIVEL → AGENDADO (coletor aceita coleta)
    - AGENDADO → COLETADO (coletor realiza coleta)
    - COLETADO → ENTREGUE (coletor entrega na receptora)
    - Qualquer → CANCELADO (produtor ou coletor cancela)
    
    O sistema registra a mudança no histórico automaticamente.
    """
)
async def atualizar_status(
    residuo_id: str,
    dados: ResidueStatusUpdate,
    current_user: dict = Depends(get_current_user)
) -> ResidueResponse:
    """
    Atualiza status de um resíduo.
    
    Args:
        residuo_id: ID do resíduo
        dados: Novo status e detalhes opcionais
        current_user: Usuário autenticado (produtor ou coletor)
    
    Returns:
        ResidueResponse: Resíduo atualizado
    
    Raises:
        HTTPException 404: Resíduo não encontrado
    """
    return await residuo_service.atualizar_status(
        residuo_id=residuo_id,
        usuario_id=current_user.get("id"),
        dados=dados
    )
