"""
Service de Recompensas - Orquestra a lógica de negócio do sistema de gamificação.

Este service é responsável por:
- Gerenciar recompensas do sistema (produtos, vouchers, descontos, cupons)
- Controlar estoque de recompensas
- Ativar/desativar recompensas (soft delete)
- Validar regras de negócio antes de persistir

IMPORTANTE: Apenas ADMINISTRADORES podem criar/editar/desativar recompensas.
Produtores apenas visualizam recompensas ativas disponíveis para resgate.
"""

from typing import List, Optional
from fastapi import HTTPException

from src.infra.database.repositories import recompensa_repo
from src.schemas.recompensa_schema import (
    RecompensaCreate,
    RecompensaUpdate,
    RecompensaResponse
)


class RecompensaService:
    """
    Service de Recompensas.
    Centraliza toda a lógica de negócio relacionada a recompensas do sistema de gamificação.
    """
    
    # Constantes
    MAX_LIMIT = 100
    DEFAULT_SKIP = 0
    
    async def _buscar_e_validar_recompensa(self, recompensa_id: str) -> dict:
        """
        Método auxiliar para buscar e validar existência de recompensa.
        
        Args:
            recompensa_id: ID da recompensa
            
        Returns:
            dict: Dados da recompensa
            
        Raises:
            HTTPException 404: Recompensa não encontrada
        """
        recompensa = await recompensa_repo.buscar_por_id(recompensa_id)
        if not recompensa:
            raise HTTPException(404, "Recompensa não encontrada")
        return recompensa
    
    async def _buscar_recompensa_atualizada(self, recompensa_id: str) -> RecompensaResponse:
        """
        Método auxiliar para buscar recompensa atualizada após operação.
        
        Args:
            recompensa_id: ID da recompensa
            
        Returns:
            RecompensaResponse: Recompensa atualizada
            
        Raises:
            HTTPException 500: Erro ao recuperar
        """
        recompensa = await recompensa_repo.buscar_por_id(recompensa_id)
        if not recompensa:
            raise HTTPException(500, "Erro ao recuperar recompensa atualizada")
        return RecompensaResponse(**recompensa)
    
    async def listar_recompensas_ativas(
        self,
        com_estoque: bool = False,
        skip: int = DEFAULT_SKIP,
        limit: int = MAX_LIMIT
    ) -> List[RecompensaResponse]:
        """
        Lista todas as recompensas ativas disponíveis para resgate.
        
        Este método é usado por PRODUTORES quando vão visualizar recompensas disponíveis.
        Retorna apenas recompensas com `ativo=True`.
        
        Args:
            com_estoque: Se True, retorna apenas recompensas com estoque > 0
            skip: Quantidade de registros a pular (paginação)
            limit: Quantidade máxima de registros
        
        Returns:
            List[RecompensaResponse]: Lista de recompensas ativas
        
        Example:
            ```python
            recompensas = await recompensa_service.listar_recompensas_ativas(com_estoque=True)
            # [
            #   {"id": "1", "nome": "Vale R$ 50", "pontos_necessarios": 500, "estoque": 100},
            #   {"id": "2", "nome": "Ecobag", "pontos_necessarios": 200, "estoque": 50},
            # ]
            ```
        """
        recompensas = await recompensa_repo.listar_recompensas_ativas(
            com_estoque=com_estoque,
            skip=skip,
            limit=limit
        )
        return [RecompensaResponse(**r) for r in recompensas]
    
    
    async def obter_recompensa(self, recompensa_id: str) -> RecompensaResponse:
        """
        Obtém detalhes completos de uma recompensa específica.
        
        Args:
            recompensa_id: ID da recompensa
        
        Returns:
            RecompensaResponse: Dados completos da recompensa
        
        Raises:
            HTTPException 404: Recompensa não encontrada
        """
        recompensa = await self._buscar_e_validar_recompensa(recompensa_id)
        return RecompensaResponse(**recompensa)
    
    
    async def listar_todas_recompensas(
        self,
        skip: int = DEFAULT_SKIP,
        limit: int = MAX_LIMIT
    ) -> List[RecompensaResponse]:
        """
        Lista TODAS as recompensas (ativas e inativas).
        
        Este método é usado por ADMINISTRADORES no painel de gestão.
        Retorna recompensas ativas e inativas para permitir gerenciamento completo.
        
        Args:
            skip: Quantidade de registros a pular (paginação)
            limit: Quantidade máxima de registros
        
        Returns:
            List[RecompensaResponse]: Lista completa de recompensas
        
        Example:
            ```python
            recompensas = await recompensa_service.listar_todas_recompensas()
            # [
            #   {"id": "1", "nome": "Vale R$ 50", "ativo": True, ...},
            #   {"id": "2", "nome": "Produto Descontinuado", "ativo": False, ...},
            # ]
            ```
        """
        recompensas = await recompensa_repo.listar_todas_recompensas(
            skip=skip,
            limit=limit
        )
        return [RecompensaResponse(**r) for r in recompensas]
    
    
    async def criar_recompensa(self, dados: RecompensaCreate) -> RecompensaResponse:
        """
        Cria nova recompensa no sistema.
        
        **Apenas ADMINISTRADORES podem criar recompensas.**
        
        Validações:
        - Nome não pode estar vazio
        - Tipo deve ser válido (produto, desconto, voucher, cupom)
        - Pontos necessários deve ser maior que zero
        - Estoque não pode ser negativo
        
        Args:
            dados: Dados da nova recompensa
        
        Returns:
            RecompensaResponse: Recompensa criada
        
        Raises:
            HTTPException 500: Erro ao criar recompensa
        
        Example:
            ```python
            nova_recompensa = RecompensaCreate(
                nome="Vale R$ 50",
                tipo="voucher",
                descricao="Vale-compra de R$ 50,00",
                pontos_necessarios=500,
                estoque=100,
                ativo=True
            )
            recompensa_criada = await service.criar_recompensa(nova_recompensa)
            ```
        """
        # Preparar documento para persistência
        recompensa_dict = dados.model_dump()
        
        # Criar recompensa no banco
        recompensa_id = await recompensa_repo.criar_recompensa(recompensa_dict)
        
        # Retornar recompensa criada
        return await self._buscar_recompensa_atualizada(recompensa_id)
    
    
    async def atualizar_recompensa(
        self,
        recompensa_id: str,
        dados: RecompensaUpdate
    ) -> RecompensaResponse:
        """
        Atualiza dados de uma recompensa existente.
        
        **Apenas ADMINISTRADORES podem atualizar recompensas.**
        
        Campos que podem ser atualizados:
        - `nome`: Renomear a recompensa
        - `tipo`: Alterar tipo
        - `descricao`: Alterar descrição
        - `pontos_necessarios`: Ajustar pontos necessários
        - `foto_url`: Atualizar foto
        - `estoque`: Ajustar estoque
        - `parceiro`: Atualizar parceiro
        - `ativo`: Ativar/desativar
        
        ATENÇÃO: Alterar pontos necessários NÃO afeta resgates já realizados!
        
        Args:
            recompensa_id: ID da recompensa
            dados: Novos dados (campos opcionais)
        
        Returns:
            RecompensaResponse: Recompensa atualizada
        
        Raises:
            HTTPException 404: Recompensa não encontrada
            HTTPException 500: Erro ao atualizar
        """
        # Verificar se recompensa existe
        recompensa = await self._buscar_e_validar_recompensa(recompensa_id)
        
        # Preparar updates (apenas campos fornecidos)
        updates = dados.model_dump(exclude_unset=True)
        
        if not updates:
            # Se não há updates, retornar a recompensa atual
            return RecompensaResponse(**recompensa)
        
        # Atualizar
        success = await recompensa_repo.atualizar_recompensa(recompensa_id, updates)
        if not success:
            raise HTTPException(500, "Erro ao atualizar recompensa")
        
        # Retornar atualizada
        return await self._buscar_recompensa_atualizada(recompensa_id)
    
    
    async def atualizar_estoque(
        self,
        recompensa_id: str,
        quantidade: int
    ) -> RecompensaResponse:
        """
        Atualiza o estoque de uma recompensa (incremento ou decremento).
        
        **Apenas ADMINISTRADORES podem atualizar estoque manualmente.**
        
        Args:
            recompensa_id: ID da recompensa
            quantidade: Quantidade a adicionar (positivo) ou remover (negativo)
        
        Returns:
            RecompensaResponse: Recompensa com estoque atualizado
        
        Raises:
            HTTPException 404: Recompensa não encontrada
            HTTPException 500: Erro ao atualizar estoque
        
        Example:
            ```python
            # Adicionar 50 unidades ao estoque
            recompensa = await service.atualizar_estoque("recompensa_id", 50)
            
            # Remover 10 unidades do estoque
            recompensa = await service.atualizar_estoque("recompensa_id", -10)
            ```
        """
        # Verificar se existe
        await self._buscar_e_validar_recompensa(recompensa_id)
        
        # Atualizar estoque
        success = await recompensa_repo.atualizar_estoque(recompensa_id, quantidade)
        if not success:
            raise HTTPException(500, "Erro ao atualizar estoque")
        
        # Retornar atualizada
        return await self._buscar_recompensa_atualizada(recompensa_id)
    
    
    async def desativar_recompensa(self, recompensa_id: str) -> RecompensaResponse:
        """
        Desativa uma recompensa (soft delete).
        
        **Apenas ADMINISTRADORES podem desativar recompensas.**
        
        A recompensa não é deletada do banco, apenas marcada como `ativo=False`.
        Isso garante que:
        - Resgates antigos mantém referência à recompensa
        - Histórico permanece consistente
        - Recompensa pode ser reativada no futuro
        
        Recompensas inativas NÃO aparecem na lista de seleção para produtores.
        
        Args:
            recompensa_id: ID da recompensa
        
        Returns:
            RecompensaResponse: Recompensa desativada
        
        Raises:
            HTTPException 404: Recompensa não encontrada
        """
        # Verificar se existe
        await self._buscar_e_validar_recompensa(recompensa_id)
        
        # Desativar (soft delete)
        success = await recompensa_repo.desativar_recompensa(recompensa_id)
        if not success:
            raise HTTPException(500, "Erro ao desativar recompensa")
        
        # Retornar desativada
        return await self._buscar_recompensa_atualizada(recompensa_id)
    
    
    async def reativar_recompensa(self, recompensa_id: str) -> RecompensaResponse:
        """
        Reativa uma recompensa previamente desativada.
        
        **Apenas ADMINISTRADORES podem reativar recompensas.**
        
        Args:
            recompensa_id: ID da recompensa
        
        Returns:
            RecompensaResponse: Recompensa reativada
        
        Raises:
            HTTPException 404: Recompensa não encontrada
        """
        # Verificar se existe
        await self._buscar_e_validar_recompensa(recompensa_id)
        
        # Reativar
        success = await recompensa_repo.ativar_recompensa(recompensa_id)
        if not success:
            raise HTTPException(500, "Erro ao reativar recompensa")
        
        # Retornar reativada
        return await self._buscar_recompensa_atualizada(recompensa_id)
