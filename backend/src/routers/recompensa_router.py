"""
Router de Recompensas - Endpoints REST para operações com recompensas do sistema de gamificação.

Este router expõe as funcionalidades do RecompensaService através de endpoints HTTP.

CONTROLE DE ACESSO:
- Endpoints públicos (sem autenticação):
  - GET /recompensas/ativas - Listar recompensas disponíveis
  
- Endpoints para PRODUTORES autenticados:
  - GET /recompensas/ativas - Listar para visualizar opções de resgate
  - GET /recompensas/{id} - Ver detalhes de uma recompensa
  
- Endpoints para GESTORES DE RECOMPENSAS:
  - GET /recompensas - Listar todas (ativas e inativas)
  - POST /recompensas - Criar nova recompensa
  - PUT /recompensas/{id} - Atualizar recompensa
  - PATCH /recompensas/{id}/estoque - Atualizar estoque manualmente
  - DELETE /recompensas/{id} - Desativar recompensa (soft delete)
  - POST /recompensas/{id}/reativar - Reativar recompensa
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List

from src.schemas.recompensa_schema import (
    RecompensaResponse,
    RecompensaCreate,
    RecompensaUpdate
)
from src.service.recompensa_service import RecompensaService
from src.infra.security.dependencies import get_current_user

# Inicializar router e service
router = APIRouter(
    prefix="/recompensas",
    tags=["Recompensas"],
    responses={
        401: {"description": "Não autenticado"},
        403: {"description": "Sem permissão - Apenas gestores de recompensas"},
        404: {"description": "Recompensa não encontrada"}
    }
)

# Instância do service
recompensa_service = RecompensaService()


def require_gestor_recompensas(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency para validar se usuário é gestor de recompensas.
    
    Gestor de recompensas é uma role específica responsável por gerenciar
    o catálogo de recompensas do sistema de gamificação.
    
    Raises:
        HTTPException 403: Se usuário não for gestor_recompensas
    """
    if current_user.get("role_id") != "gestor_recompensas":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Apenas gestores de recompensas podem realizar esta ação."
        )
    return current_user


# ============ ENDPOINTS PÚBLICOS ============

@router.get(
    "/ativas",
    response_model=List[RecompensaResponse],
    summary="Listar recompensas ativas",
    description="""
    Lista todas as recompensas disponíveis para resgate.
    
    **Este endpoint é PÚBLICO** (não requer autenticação).
    
    Retorna apenas recompensas com `ativo=True`, que são os prêmios
    que os produtores podem resgatar usando seus pontos.
    
    Útil para:
    - Mostrar catálogo de recompensas disponíveis
    - Exibir opções de resgate para produtores
    - Consultar pontos necessários para cada recompensa
    
    Parâmetros:
    - `com_estoque`: Se True, retorna apenas recompensas com estoque > 0
    - `skip`: Quantidade de registros a pular (paginação)
    - `limit`: Quantidade máxima de registros (max: 100)
    """
)
async def listar_recompensas_ativas(
    com_estoque: bool = Query(False, description="Filtrar apenas recompensas com estoque disponível"),
    skip: int = Query(0, ge=0, description="Quantidade de registros a pular"),
    limit: int = Query(100, ge=1, le=100, description="Quantidade máxima de registros")
) -> List[RecompensaResponse]:
    """
    Lista recompensas ativas disponíveis.
    
    Returns:
        List[RecompensaResponse]: Recompensas ativas
        
    Example Response:
        ```json
        [
          {
            "id": "60c72b2f9b1d4c3a4c8e4d3e",
            "nome": "Vale-compra R$ 50,00",
            "tipo": "voucher",
            "descricao": "Vale-compra de R$ 50,00 para usar em lojas parceiras",
            "pontos_necessarios": 500,
            "foto_url": "https://example.com/vale50.jpg",
            "estoque": 100,
            "parceiro": "Supermercado Verde",
            "data_cadastro": "2025-11-18T10:30:00Z",
            "ativo": true
          },
          {
            "id": "60c72b2f9b1d4c3a4c8e4d3f",
            "nome": "Ecobag Reutilizável",
            "tipo": "produto",
            "descricao": "Ecobag de algodão orgânico",
            "pontos_necessarios": 200,
            "estoque": 50,
            "ativo": true
          }
        ]
        ```
    """
    return await recompensa_service.listar_recompensas_ativas(
        com_estoque=com_estoque,
        skip=skip,
        limit=limit
    )


@router.get(
    "/{recompensa_id}",
    response_model=RecompensaResponse,
    summary="Obter detalhes de uma recompensa",
    description="""
    Retorna os detalhes completos de uma recompensa específica.
    
    Qualquer usuário autenticado pode acessar.
    Produtores usam este endpoint para ver detalhes antes de resgatar.
    """
)
async def obter_recompensa(
    recompensa_id: str,
    current_user: dict = Depends(get_current_user)
) -> RecompensaResponse:
    """
    Obtém detalhes de uma recompensa.
    
    Args:
        recompensa_id: ID da recompensa
        current_user: Usuário autenticado
    
    Returns:
        RecompensaResponse: Dados completos da recompensa
    
    Raises:
        HTTPException 404: Recompensa não encontrada
    """
    return await recompensa_service.obter_recompensa(recompensa_id)


# ============ ENDPOINTS ADMINISTRATIVOS ============

@router.get(
    "/",
    response_model=List[RecompensaResponse],
    summary="[GESTOR] Listar todas as recompensas",
    description="""
    Lista TODAS as recompensas (ativas e inativas).
    
    **Apenas GESTORES DE RECOMPENSAS podem acessar.**
    
    Usado no painel de gestão para gerenciar recompensas.
    """,
    dependencies=[Depends(require_gestor_recompensas)]
)
async def listar_todas_recompensas(
    skip: int = Query(0, ge=0, description="Quantidade de registros a pular"),
    limit: int = Query(100, ge=1, le=100, description="Quantidade máxima de registros"),
    _: dict = Depends(require_gestor_recompensas)
) -> List[RecompensaResponse]:
    """
    Lista todas as recompensas do sistema.
    
    Returns:
        List[RecompensaResponse]: Todas as recompensas
    """
    return await recompensa_service.listar_todas_recompensas(skip=skip, limit=limit)


@router.post(
    "/",
    response_model=RecompensaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[GESTOR] Criar nova recompensa",
    description="""
    Cria uma nova recompensa no sistema de gamificação.
    
    **Apenas GESTORES DE RECOMPENSAS podem criar recompensas.**
    
    Validações:
    - Nome não pode estar vazio (3-100 caracteres)
    - Tipo deve ser válido: 'produto', 'desconto', 'voucher', 'cupom'
    - Descrição deve ter pelo menos 10 caracteres
    - Pontos necessários deve ser maior que zero
    - Estoque não pode ser negativo (padrão: 999)
    
    Exemplo de uso:
    - Adicionar nova recompensa para produtores resgatarem
    - Criar promoções especiais
    - Cadastrar parcerias com empresas
    """,
    dependencies=[Depends(require_gestor_recompensas)]
)
async def criar_recompensa(
    dados: RecompensaCreate,
    gestor_user: dict = Depends(require_gestor_recompensas)
) -> RecompensaResponse:
    """
    Cria nova recompensa.
    
    Args:
        dados: Dados da recompensa
        gestor_user: Usuário gestor de recompensas autenticado
    
    Returns:
        RecompensaResponse: Recompensa criada
        
    Example Request Body:
        ```json
        {
          "nome": "Vale-compra R$ 50,00",
          "tipo": "voucher",
          "descricao": "Vale-compra de R$ 50,00 para usar em lojas parceiras",
          "pontos_necessarios": 500,
          "foto_url": "https://example.com/vale50.jpg",
          "estoque": 100,
          "parceiro": "Supermercado Verde",
          "ativo": true
        }
        ```
    """
    return await recompensa_service.criar_recompensa(dados)


@router.put(
    "/{recompensa_id}",
    response_model=RecompensaResponse,
    summary="[GESTOR] Atualizar recompensa",
    description="""
    Atualiza os dados de uma recompensa existente.
    
    **Apenas GESTORES DE RECOMPENSAS podem atualizar recompensas.**
    
    Campos que podem ser atualizados:
    - `nome`: Renomear a recompensa
    - `tipo`: Alterar tipo
    - `descricao`: Alterar descrição
    - `pontos_necessarios`: Ajustar pontos necessários
    - `foto_url`: Atualizar foto
    - `estoque`: Ajustar estoque
    - `parceiro`: Atualizar parceiro
    - `ativo`: Ativar/desativar
    
    **IMPORTANTE:** Alterar pontos necessários NÃO afeta resgates já realizados!
    """,
    dependencies=[Depends(require_gestor_recompensas)]
)
async def atualizar_recompensa(
    recompensa_id: str,
    dados: RecompensaUpdate,
    gestor_user: dict = Depends(require_gestor_recompensas)
) -> RecompensaResponse:
    """
    Atualiza dados de uma recompensa.
    
    Args:
        recompensa_id: ID da recompensa
        dados: Novos dados (campos opcionais)
        gestor_user: Usuário gestor de recompensas autenticado
    
    Returns:
        RecompensaResponse: Recompensa atualizada
    
    Raises:
        HTTPException 404: Recompensa não encontrada
    """
    return await recompensa_service.atualizar_recompensa(recompensa_id, dados)


@router.patch(
    "/{recompensa_id}/estoque",
    response_model=RecompensaResponse,
    summary="[GESTOR] Atualizar estoque da recompensa",
    description="""
    Atualiza o estoque de uma recompensa (incremento ou decremento).
    
    **Apenas GESTORES DE RECOMPENSAS podem atualizar estoque manualmente.**
    
    Endpoint auxiliar para facilitar ajuste de estoque sem enviar todos os campos.
    
    Exemplos de uso:
    - Adicionar mais unidades ao estoque: quantidade positiva
    - Remover unidades (ajuste manual): quantidade negativa
    - Corrigir inconsistências de estoque
    """,
    dependencies=[Depends(require_gestor_recompensas)]
)
async def atualizar_estoque(
    recompensa_id: str,
    quantidade: int = Query(..., description="Quantidade a adicionar (positivo) ou remover (negativo)"),
    gestor_user: dict = Depends(require_gestor_recompensas)
) -> RecompensaResponse:
    """
    Atualiza estoque de uma recompensa.
    
    Args:
        recompensa_id: ID da recompensa
        quantidade: Quantidade a incrementar/decrementar
        gestor_user: Usuário gestor de recompensas autenticado
    
    Returns:
        RecompensaResponse: Recompensa com estoque atualizado
    
    Raises:
        HTTPException 404: Recompensa não encontrada
        
    Example:
        PATCH /recompensas/60c72b2f9b1d4c3a4c8e4d3e/estoque?quantidade=50
        PATCH /recompensas/60c72b2f9b1d4c3a4c8e4d3e/estoque?quantidade=-10
    """
    return await recompensa_service.atualizar_estoque(recompensa_id, quantidade)


@router.delete(
    "/{recompensa_id}",
    response_model=RecompensaResponse,
    summary="[GESTOR] Desativar recompensa",
    description="""
    Desativa uma recompensa (soft delete).
    
    **Apenas GESTORES DE RECOMPENSAS podem desativar recompensas.**
    
    A recompensa NÃO é deletada do banco, apenas marcada como `ativo=False`.
    
    Benefícios do soft delete:
    - Resgates antigos mantêm referência à recompensa
    - Histórico permanece consistente
    - Recompensa pode ser reativada no futuro
    - Estatísticas não são afetadas
    
    Recompensas inativas NÃO aparecem na lista de opções para produtores.
    """,
    dependencies=[Depends(require_gestor_recompensas)]
)
async def desativar_recompensa(
    recompensa_id: str,
    gestor_user: dict = Depends(require_gestor_recompensas)
) -> RecompensaResponse:
    """
    Desativa uma recompensa (soft delete).
    
    Args:
        recompensa_id: ID da recompensa
        gestor_user: Usuário gestor de recompensas autenticado
    
    Returns:
        RecompensaResponse: Recompensa desativada
    
    Raises:
        HTTPException 404: Recompensa não encontrada
    """
    return await recompensa_service.desativar_recompensa(recompensa_id)


@router.post(
    "/{recompensa_id}/reativar",
    response_model=RecompensaResponse,
    summary="[GESTOR] Reativar recompensa",
    description="""
    Reativa uma recompensa previamente desativada.
    
    **Apenas GESTORES DE RECOMPENSAS podem reativar recompensas.**
    
    Após reativação, a recompensa volta a aparecer na lista de opções
    para os produtores resgatarem.
    """,
    dependencies=[Depends(require_gestor_recompensas)]
)
async def reativar_recompensa(
    recompensa_id: str,
    gestor_user: dict = Depends(require_gestor_recompensas)
) -> RecompensaResponse:
    """
    Reativa uma recompensa.
    
    Args:
        recompensa_id: ID da recompensa
        gestor_user: Usuário gestor de recompensas autenticado
    
    Returns:
        RecompensaResponse: Recompensa reativada
    
    Raises:
        HTTPException 404: Recompensa não encontrada
    """
    return await recompensa_service.reativar_recompensa(recompensa_id)

