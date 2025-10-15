"""
Router de Categorias - Endpoints REST para operações com categorias de resíduos.

Este router expõe as funcionalidades do CategoriaService através de endpoints HTTP.

CONTROLE DE ACESSO:
- Endpoints públicos (sem autenticação):
  - GET /categorias/ativas - Listar categorias disponíveis
  
- Endpoints para PRODUTORES autenticados:
  - GET /categorias/ativas - Listar para seleção ao criar resíduo
  
- Endpoints para ADMINISTRADORES:
  - GET /categorias - Listar todas (ativas e inativas)
  - POST /categorias - Criar nova categoria
  - PUT /categorias/{id} - Atualizar categoria
  - PATCH /categorias/{id}/preco - Atualizar apenas preço
  - DELETE /categorias/{id} - Desativar categoria (soft delete)
  - POST /categorias/{id}/reativar - Reativar categoria
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from src.schemas.categoria_schema import (
    CategoriaResponseDTO,
    CategoriaCreateDTO,
    CategoriaUpdateDTO,
    CategoriaListResponseDTO
)
from src.service.categoria_service import CategoriaService
from src.infra.security.dependencies import get_current_user

# Inicializar router e service
router = APIRouter(
    prefix="/categorias",
    tags=["Categorias"],
    responses={
        401: {"description": "Não autenticado"},
        403: {"description": "Sem permissão - Apenas administradores"},
        404: {"description": "Categoria não encontrada"}
    }
)

# Instância do service
categoria_service = CategoriaService()


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency para validar se usuário é administrador.
    
    Raises:
        HTTPException 403: Se usuário não for admin
    """
    if current_user.get("role_id") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Apenas administradores podem realizar esta ação."
        )
    return current_user


# ============ ENDPOINTS PÚBLICOS ============

@router.get(
    "/ativas",
    response_model=List[CategoriaListResponseDTO],
    summary="Listar categorias ativas",
    description="""
    Lista todas as categorias de resíduos disponíveis para seleção.
    
    **Este endpoint é PÚBLICO** (não requer autenticação).
    
    Retorna apenas categorias com `ativo=True`, que são os tipos de materiais
    que os produtores podem cadastrar no momento.
    
    Útil para:
    - Mostrar opções no formulário de cadastro de resíduo
    - Exibir tipos aceitos na plataforma
    - Consultar preços de referência por tipo
    """
)
async def listar_categorias_ativas() -> List[CategoriaListResponseDTO]:
    """
    Lista categorias ativas disponíveis.
    
    Returns:
        List[CategoriaListResponseDTO]: Categorias ativas simplificadas
        
    Example Response:
        ```json
        [
          {
            "id": "60c72b2f9b1d4c3a4c8e4d3e",
            "tipo": "Plástico",
            "descricao": "Garrafas PET, sacolas plásticas, embalagens",
            "preco_por_kg": 2.50,
            "ativo": true
          },
          {
            "id": "60c72b2f9b1d4c3a4c8e4d3f",
            "tipo": "Vidro",
            "descricao": "Garrafas, potes, frascos de vidro",
            "preco_por_kg": 0.80,
            "ativo": true
          }
        ]
        ```
    """
    return await categoria_service.listar_categorias_ativas()


# ============ ENDPOINTS ADMINISTRATIVOS ============

@router.get(
    "/",
    response_model=List[CategoriaResponseDTO],
    summary="[ADMIN] Listar todas as categorias",
    description="""
    Lista TODAS as categorias (ativas e inativas).
    
    **Apenas ADMINISTRADORES podem acessar.**
    
    Usado no painel administrativo para gerenciar categorias.
    """,
    dependencies=[Depends(require_admin)]
)
async def listar_todas_categorias(
    _: dict = Depends(require_admin)
) -> List[CategoriaResponseDTO]:
    """
    Lista todas as categorias do sistema.
    
    Returns:
        List[CategoriaResponseDTO]: Todas as categorias (completas)
    """
    return await categoria_service.listar_todas_categorias()


@router.get(
    "/{categoria_id}",
    response_model=CategoriaResponseDTO,
    summary="Obter detalhes de uma categoria",
    description="""
    Retorna os detalhes completos de uma categoria específica.
    
    Qualquer usuário autenticado pode acessar.
    """
)
async def obter_categoria(
    categoria_id: str,
    current_user: dict = Depends(get_current_user)
) -> CategoriaResponseDTO:
    """
    Obtém detalhes de uma categoria.
    
    Args:
        categoria_id: ID da categoria
        current_user: Usuário autenticado
    
    Returns:
        CategoriaResponseDTO: Dados completos da categoria
    
    Raises:
        HTTPException 404: Categoria não encontrada
    """
    return await categoria_service.obter_categoria(categoria_id)


@router.post(
    "/",
    response_model=CategoriaResponseDTO,
    status_code=status.HTTP_201_CREATED,
    summary="[ADMIN] Criar nova categoria",
    description="""
    Cria uma nova categoria de resíduo no sistema.
    
    **Apenas ADMINISTRADORES podem criar categorias.**
    
    Validações:
    - O tipo não pode estar duplicado (case-insensitive)
    - O preço deve ser maior que zero
    - A descrição deve ter pelo menos 10 caracteres
    
    Exemplo de uso:
    - Adicionar novo tipo de material reciclável
    - Criar categoria regional específica
    """,
    dependencies=[Depends(require_admin)]
)
async def criar_categoria(
    dados: CategoriaCreateDTO,
    admin_user: dict = Depends(require_admin)
) -> CategoriaResponseDTO:
    """
    Cria nova categoria.
    
    Args:
        dados: Dados da categoria (tipo, descrição, preço, ativo)
        admin_user: Usuário admin autenticado
    
    Returns:
        CategoriaResponseDTO: Categoria criada
    
    Raises:
        HTTPException 400: Tipo já existe
        
    Example Request Body:
        ```json
        {
          "tipo": "Bateria",
          "descricao": "Pilhas e baterias recarregáveis de todos os tipos",
          "preco_por_kg": 10.00,
          "ativo": true
        }
        ```
    """
    return await categoria_service.criar_categoria(dados)


@router.put(
    "/{categoria_id}",
    response_model=CategoriaResponseDTO,
    summary="[ADMIN] Atualizar categoria",
    description="""
    Atualiza os dados de uma categoria existente.
    
    **Apenas ADMINISTRADORES podem atualizar categorias.**
    
    Campos que podem ser atualizados:
    - `tipo`: Renomear a categoria
    - `descricao`: Alterar descrição
    - `preco_por_kg`: Ajustar preço de referência
    - `ativo`: Ativar/desativar
    
    **IMPORTANTE:** Alterar o preço NÃO afeta resíduos já criados!
    O valor estimado é calculado no momento da criação do resíduo.
    """,
    dependencies=[Depends(require_admin)]
)
async def atualizar_categoria(
    categoria_id: str,
    dados: CategoriaUpdateDTO,
    admin_user: dict = Depends(require_admin)
) -> CategoriaResponseDTO:
    """
    Atualiza dados de uma categoria.
    
    Args:
        categoria_id: ID da categoria
        dados: Novos dados (campos opcionais)
        admin_user: Usuário admin autenticado
    
    Returns:
        CategoriaResponseDTO: Categoria atualizada
    
    Raises:
        HTTPException 404: Categoria não encontrada
        HTTPException 400: Novo tipo já existe
    """
    return await categoria_service.atualizar_categoria(categoria_id, dados)


@router.patch(
    "/{categoria_id}/preco",
    response_model=CategoriaResponseDTO,
    summary="[ADMIN] Atualizar preço da categoria",
    description="""
    Atualiza apenas o preço de uma categoria.
    
    **Apenas ADMINISTRADORES podem atualizar preços.**
    
    Endpoint auxiliar para facilitar ajuste de preços sem enviar todos os campos.
    Útil para reajustes periódicos de preços de materiais recicláveis.
    """,
    dependencies=[Depends(require_admin)]
)
async def atualizar_preco(
    categoria_id: str,
    novo_preco: float,
    admin_user: dict = Depends(require_admin)
) -> CategoriaResponseDTO:
    """
    Atualiza preço de uma categoria.
    
    Args:
        categoria_id: ID da categoria
        novo_preco: Novo preço por kg (query parameter)
        admin_user: Usuário admin autenticado
    
    Returns:
        CategoriaResponseDTO: Categoria com preço atualizado
    
    Raises:
        HTTPException 404: Categoria não encontrada
        HTTPException 400: Preço inválido (≤ 0)
        
    Example:
        PATCH /categorias/60c72b2f9b1d4c3a4c8e4d3e/preco?novo_preco=3.50
    """
    return await categoria_service.atualizar_preco(categoria_id, novo_preco)


@router.delete(
    "/{categoria_id}",
    response_model=CategoriaResponseDTO,
    summary="[ADMIN] Desativar categoria",
    description="""
    Desativa uma categoria (soft delete).
    
    **Apenas ADMINISTRADORES podem desativar categorias.**
    
    A categoria NÃO é deletada do banco, apenas marcada como `ativo=False`.
    
    Benefícios do soft delete:
    - Resíduos antigos mantêm referência à categoria
    - Histórico permanece consistente
    - Categoria pode ser reativada no futuro
    - Métricas não são afetadas
    
    Categorias inativas NÃO aparecem na lista de seleção para produtores.
    """,
    dependencies=[Depends(require_admin)]
)
async def desativar_categoria(
    categoria_id: str,
    admin_user: dict = Depends(require_admin)
) -> CategoriaResponseDTO:
    """
    Desativa uma categoria (soft delete).
    
    Args:
        categoria_id: ID da categoria
        admin_user: Usuário admin autenticado
    
    Returns:
        CategoriaResponseDTO: Categoria desativada
    
    Raises:
        HTTPException 404: Categoria não encontrada
    """
    return await categoria_service.desativar_categoria(categoria_id)


@router.post(
    "/{categoria_id}/reativar",
    response_model=CategoriaResponseDTO,
    summary="[ADMIN] Reativar categoria",
    description="""
    Reativa uma categoria previamente desativada.
    
    **Apenas ADMINISTRADORES podem reativar categorias.**
    
    Após reativação, a categoria volta a aparecer na lista de seleção
    para os produtores cadastrarem resíduos.
    """,
    dependencies=[Depends(require_admin)]
)
async def reativar_categoria(
    categoria_id: str,
    admin_user: dict = Depends(require_admin)
) -> CategoriaResponseDTO:
    """
    Reativa uma categoria.
    
    Args:
        categoria_id: ID da categoria
        admin_user: Usuário admin autenticado
    
    Returns:
        CategoriaResponseDTO: Categoria reativada
    
    Raises:
        HTTPException 404: Categoria não encontrada
    """
    return await categoria_service.reativar_categoria(categoria_id)
