"""
Service de Categorias - Orquestra a lógica de negócio de categorias de resíduos.

Este service é responsável por:
- Gerenciar tipos de materiais recicláveis (Plástico, Vidro, Papel, Metal, Eletrônico)
- Controlar preços de referência por kg
- Ativar/desativar categorias (soft delete)
- Validar regras de negócio antes de persistir

IMPORTANTE: Apenas ADMINISTRADORESpodem criar/editar/desativar categorias.
Produtores apenas visualizam categorias ativas para selecionar ao criar resíduos.
"""

from typing import List, Optional
from fastapi import HTTPException

from src.infra.database.repositories import categoria_repo
from src.infra.database.models import CategoriaResiduo
from src.schemas.categoria_schema import (
    CategoriaResponseDTO,
    CategoriaCreateDTO,
    CategoriaUpdateDTO,
    CategoriaListResponseDTO
)


class CategoriaService:
    """
    Service de Categorias.
    Centraliza toda a lógica de negócio relacionada a categorias de resíduos.
    """
    
    async def listar_categorias_ativas(self) -> List[CategoriaListResponseDTO]:
        """
        Lista todas as categorias ativas disponíveis para seleção.
        
        Este método é usado por PRODUTORES quando vão cadastrar um resíduo.
        Retorna apenas categorias com `ativo=True`.
        
        Returns:
            List[CategoriaListResponseDTO]: Lista simplificada de categorias ativas
        
        Example:
            ```python
            categorias = await categoria_service.listar_categorias_ativas()
            # [
            #   {"id": "1", "tipo": "Plástico", "preco_por_kg": 2.50},
            #   {"id": "2", "tipo": "Vidro", "preco_por_kg": 0.80},
            #   ...
            # ]
            ```
        """
        categorias = await categoria_repo.listar_categorias_ativas()
        return [CategoriaListResponseDTO(**cat) for cat in categorias]
    
    
    async def listar_todas_categorias(self) -> List[CategoriaResponseDTO]:
        """
        Lista TODAS as categorias (ativas e inativas).
        
        Este método é usado por ADMINISTRADORES no painel de gestão.
        Retorna categorias ativas e inativas para permitir gerenciamento completo.
        
        Returns:
            List[CategoriaResponseDTO]: Lista completa de categorias
        
        Example:
            ```python
            categorias = await categoria_service.listar_todas_categorias()
            # [
            #   {"id": "1", "tipo": "Plástico", "ativo": True, ...},
            #   {"id": "5", "tipo": "Bateria", "ativo": False, ...},  # Desativada
            # ]
            ```
        """
        categorias = await categoria_repo.listar_todas_categorias()
        return [CategoriaResponseDTO(**cat) for cat in categorias]
    
    
    async def obter_categoria(self, categoria_id: str) -> CategoriaResponseDTO:
        """
        Obtém detalhes completos de uma categoria específica.
        
        Args:
            categoria_id: ID da categoria
        
        Returns:
            CategoriaResponseDTO: Dados completos da categoria
        
        Raises:
            HTTPException 404: Categoria não encontrada
        """
        categoria = await categoria_repo.buscar_por_id(categoria_id)
        if not categoria:
            raise HTTPException(404, f"Categoria '{categoria_id}' não encontrada")
        
        return CategoriaResponseDTO(**categoria)
    
    
    async def buscar_por_tipo(self, tipo: str) -> Optional[CategoriaResponseDTO]:
        """
        Busca uma categoria pelo nome do tipo (ex: "Plástico").
        
        Retorna apenas se a categoria estiver ativa.
        
        Args:
            tipo: Nome do tipo da categoria
        
        Returns:
            Optional[CategoriaResponseDTO]: Categoria encontrada ou None
        """
        categoria = await categoria_repo.buscar_por_tipo(tipo)
        if categoria:
            return CategoriaResponseDTO(**categoria)
        return None
    
    
    async def criar_categoria(self, dados: CategoriaCreateDTO) -> CategoriaResponseDTO:
        """
        Cria nova categoria de resíduo.
        
        **Apenas ADMINISTRADORES podem criar categorias.**
        
        Validações:
        - Tipo não pode estar duplicado (case-insensitive)
        - Preço deve ser maior que zero
        - Descrição deve ser clara e detalhada
        
        Args:
            dados: Dados da nova categoria
        
        Returns:
            CategoriaResponseDTO: Categoria criada
        
        Raises:
            HTTPException 400: Tipo já existe
        
        Example:
            ```python
            nova_categoria = CategoriaCreateDTO(
                tipo="Bateria",
                descricao="Pilhas e baterias recarregáveis",
                preco_por_kg=10.00,
                ativo=True
            )
            categoria_criada = await service.criar_categoria(nova_categoria)
            ```
        """
        # Validar se tipo já existe (case-insensitive)
        tipo_normalizado = dados.tipo.strip().title()  # "plástico" → "Plástico"
        categoria_existente = await categoria_repo.buscar_por_tipo(tipo_normalizado)
        
        if categoria_existente:
            raise HTTPException(
                400, 
                f"Categoria do tipo '{tipo_normalizado}' já existe"
            )
        
        # Criar categoria
        categoria_dict = dados.dict()
        categoria_dict["tipo"] = tipo_normalizado  # Salvar normalizado
        
        categoria_id = await categoria_repo.criar_categoria(categoria_dict)
        
        # Retornar categoria criada
        categoria_criada = await categoria_repo.buscar_por_id(categoria_id)
        if categoria_criada:
            return CategoriaResponseDTO(**categoria_criada)
        
        raise HTTPException(500, "Erro ao recuperar categoria criada")
    
    
    async def atualizar_categoria(
        self,
        categoria_id: str,
        dados: CategoriaUpdateDTO
    ) -> CategoriaResponseDTO:
        """
        Atualiza dados de uma categoria existente.
        
        **Apenas ADMINISTRADORES podem atualizar categorias.**
        
        Campos que podem ser atualizados:
        - `tipo`: Renomear a categoria
        - `descricao`: Alterar descrição
        - `preco_por_kg`: Ajustar preço de referência
        - `ativo`: Ativar/desativar
        
        ATENÇÃO: Alterar o preço NÃO afeta resíduos já criados!
        O valor estimado é calculado no momento da criação.
        
        Args:
            categoria_id: ID da categoria
            dados: Novos dados (campos opcionais)
        
        Returns:
            CategoriaResponseDTO: Categoria atualizada
        
        Raises:
            HTTPException 404: Categoria não encontrada
            HTTPException 400: Novo tipo já existe
        """
        # Verificar se categoria existe
        categoria = await categoria_repo.buscar_por_id(categoria_id)
        if not categoria:
            raise HTTPException(404, "Categoria não encontrada")
        
        # Preparar updates
        updates = dados.dict(exclude_unset=True)
        
        # Se mudou o tipo, validar duplicação
        if "tipo" in updates:
            tipo_normalizado = updates["tipo"].strip().title()
            categoria_com_tipo = await categoria_repo.buscar_por_tipo(tipo_normalizado)
            
            # Permitir se for a mesma categoria (edição sem mudar tipo)
            if categoria_com_tipo and categoria_com_tipo.get("_id") != categoria.get("_id"):
                raise HTTPException(
                    400,
                    f"Já existe uma categoria com o tipo '{tipo_normalizado}'"
                )
            
            updates["tipo"] = tipo_normalizado
        
        # Atualizar
        success = await categoria_repo.atualizar_categoria(categoria_id, updates)
        if not success:
            raise HTTPException(500, "Erro ao atualizar categoria")
        
        # Retornar atualizada
        categoria_atualizada = await categoria_repo.buscar_por_id(categoria_id)
        if categoria_atualizada:
            return CategoriaResponseDTO(**categoria_atualizada)
        
        raise HTTPException(500, "Erro ao recuperar categoria atualizada")
    
    
    async def atualizar_preco(
        self,
        categoria_id: str,
        novo_preco: float
    ) -> CategoriaResponseDTO:
        """
        Atualiza apenas o preço de uma categoria.
        
        Método auxiliar para facilitar ajuste de preços sem enviar todos os campos.
        
        **Apenas ADMINISTRADORES podem atualizar preços.**
        
        Args:
            categoria_id: ID da categoria
            novo_preco: Novo preço por kg
        
        Returns:
            CategoriaResponseDTO: Categoria com preço atualizado
        
        Raises:
            HTTPException 404: Categoria não encontrada
            HTTPException 400: Preço inválido (≤ 0)
        """
        if novo_preco <= 0:
            raise HTTPException(400, "Preço deve ser maior que zero")
        
        # Verificar se existe
        categoria = await categoria_repo.buscar_por_id(categoria_id)
        if not categoria:
            raise HTTPException(404, "Categoria não encontrada")
        
        # Atualizar preço
        success = await categoria_repo.atualizar_preco(categoria_id, novo_preco)
        if not success:
            raise HTTPException(500, "Erro ao atualizar preço")
        
        # Retornar atualizada
        categoria_atualizada = await categoria_repo.buscar_por_id(categoria_id)
        if categoria_atualizada:
            return CategoriaResponseDTO(**categoria_atualizada)
        
        raise HTTPException(500, "Erro ao recuperar categoria atualizada")
    
    
    async def desativar_categoria(self, categoria_id: str) -> CategoriaResponseDTO:
        """
        Desativa uma categoria (soft delete).
        
        **Apenas ADMINISTRADORES podem desativar categorias.**
        
        A categoria não é deletada do banco, apenas marcada como `ativo=False`.
        Isso garante que:
        - Resíduos antigos mantém referência à categoria
        - Histórico permanece consistente
        - Categoria pode ser reativada no futuro
        
        Categorias inativas NÃO aparecem na lista de seleção para produtores.
        
        Args:
            categoria_id: ID da categoria
        
        Returns:
            CategoriaResponseDTO: Categoria desativada
        
        Raises:
            HTTPException 404: Categoria não encontrada
        """
        # Verificar se existe
        categoria = await categoria_repo.buscar_por_id(categoria_id)
        if not categoria:
            raise HTTPException(404, "Categoria não encontrada")
        
        # Desativar (soft delete)
        success = await categoria_repo.desativar_categoria(categoria_id)
        if not success:
            raise HTTPException(500, "Erro ao desativar categoria")
        
        # Retornar desativada
        categoria_desativada = await categoria_repo.buscar_por_id(categoria_id)
        if categoria_desativada:
            return CategoriaResponseDTO(**categoria_desativada)
        
        raise HTTPException(500, "Erro ao recuperar categoria desativada")
    
    
    async def reativar_categoria(self, categoria_id: str) -> CategoriaResponseDTO:
        """
        Reativa uma categoria previamente desativada.
        
        **Apenas ADMINISTRADORES podem reativar categorias.**
        
        Args:
            categoria_id: ID da categoria
        
        Returns:
            CategoriaResponseDTO: Categoria reativada
        
        Raises:
            HTTPException 404: Categoria não encontrada
        """
        # Verificar se existe
        categoria = await categoria_repo.buscar_por_id(categoria_id)
        if not categoria:
            raise HTTPException(404, "Categoria não encontrada")
        
        # Reativar
        success = await categoria_repo.reativar_categoria(categoria_id)
        if not success:
            raise HTTPException(500, "Erro ao reativar categoria")
        
        # Retornar reativada
        categoria_reativada = await categoria_repo.buscar_por_id(categoria_id)
        if categoria_reativada:
            return CategoriaResponseDTO(**categoria_reativada)
        
        raise HTTPException(500, "Erro ao recuperar categoria reativada")
