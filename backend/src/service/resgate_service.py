"""
Service de Resgate de Recompensas - Orquestra a lógica de negócio de resgate.

Este service é responsável por:
- Validar condições para resgate (recompensa ativa, estoque, pontos)
- Executar transação de resgate (debitar pontos + decrementar estoque + salvar histórico)
- Implementar rollback em caso de falha parcial
- Listar histórico de resgates do produtor

IMPORTANTE: Apenas PRODUTORES podem resgatar recompensas.
O resgate é DEFINITIVO (sem status PENDENTE ou cancelamento).
"""

from typing import List
from datetime import datetime
from fastapi import HTTPException

from src.infra.database.repositories import recompensa_repo, user_repo
from src.infra.database.repositories.resgate_repo import criar_resgate, listar_por_produtor
from src.infra.database.models.resgate_recompensa import ResgateRecompensa
from src.schemas.resgate_schema import ResgateResponse


class ResgateService:
    """
    Service de Resgate de Recompensas.
    Centraliza toda a lógica de negócio relacionada ao resgate de recompensas.
    """
    
    # Constantes
    MAX_LIMIT = 100
    DEFAULT_SKIP = 0
    
    def _validar_paginacao(self, skip: int, limit: int) -> tuple[int, int]:
        """
        Valida e ajusta parâmetros de paginação.
        
        Args:
            skip: Número de registros a pular
            limit: Número máximo de registros
            
        Returns:
            tuple[int, int]: (skip, limit) validados
        """
        if limit > self.MAX_LIMIT:
            limit = self.MAX_LIMIT
        if skip < 0:
            skip = 0
        return skip, limit
    
    async def _validar_recompensa_disponivel(self, recompensa_id: str) -> dict:
        """
        Valida se recompensa existe, está ativa e tem estoque.
        
        Args:
            recompensa_id: ID da recompensa
            
        Returns:
            dict: Dados da recompensa validada
            
        Raises:
            HTTPException 404: Recompensa não encontrada
            HTTPException 400: Recompensa inativa ou sem estoque
        """
        recompensa = await recompensa_repo.buscar_por_id(recompensa_id)
        if not recompensa:
            raise HTTPException(status_code=404, detail="Recompensa não encontrada")
        
        if not recompensa.get("ativo", False):
            raise HTTPException(status_code=400, detail="Recompensa não está disponível para resgate")
        
        estoque_atual = recompensa.get("estoque", 0)
        if estoque_atual <= 0:
            raise HTTPException(status_code=400, detail="Recompensa sem estoque disponível")
        
        return recompensa
    
    async def _validar_pontos_produtor(self, produtor_id: str, pontos_necessarios: int) -> int:
        """
        Valida se produtor existe e tem pontos suficientes.
        
        Args:
            produtor_id: ID do produtor
            pontos_necessarios: Quantidade de pontos necessários
            
        Returns:
            int: Pontos atuais do produtor
            
        Raises:
            HTTPException 404: Produtor não encontrado
            HTTPException 400: Pontos insuficientes
        """
        pontos_produtor = await user_repo.obter_pontos(produtor_id)
        if pontos_produtor is None:
            raise HTTPException(status_code=404, detail="Produtor não encontrado")
        
        if pontos_produtor < pontos_necessarios:
            raise HTTPException(
                status_code=400,
                detail=f"Pontos insuficientes. Você tem {pontos_produtor} pontos, mas precisa de {pontos_necessarios} pontos"
            )
        
        return pontos_produtor
    
    async def _executar_transacao_resgate(
        self, 
        recompensa_id: str, 
        produtor_id: str, 
        pontos_necessarios: int
    ) -> str:
        """
        Executa a transação de resgate com rollback em caso de falha.
        
        Args:
            recompensa_id: ID da recompensa
            produtor_id: ID do produtor
            pontos_necessarios: Pontos a debitar
            
        Returns:
            str: ID do resgate criado
            
        Raises:
            HTTPException 500: Erro na transação
        """
        # Debitar pontos do produtor (operação atômica)
        pontos_debitados = await user_repo.atualizar_pontos(produtor_id, -pontos_necessarios)
        if not pontos_debitados:
            raise HTTPException(status_code=500, detail="Erro ao debitar pontos do produtor")
        
        # Decrementar estoque da recompensa
        estoque_atualizado = await recompensa_repo.decrementar_estoque(recompensa_id)
        
        # ROLLBACK: Se falhou ao decrementar estoque, devolver pontos
        if not estoque_atualizado:
            await user_repo.atualizar_pontos(produtor_id, pontos_necessarios)
            raise HTTPException(status_code=500, detail="Erro ao atualizar estoque da recompensa")
        
        # Salvar registro de resgate no histórico
        resgate_doc = ResgateRecompensa(
            recompensa_id=recompensa_id,
            produtor_id=produtor_id,
            pontos_gastos=pontos_necessarios,
            data_resgate=datetime.utcnow()
        )
        
        resgate_dict = resgate_doc.model_dump(by_alias=True, exclude_unset=True)
        return await criar_resgate(resgate_dict)
    
    async def resgatar_recompensa(self, recompensa_id: str, produtor_id: str) -> ResgateResponse:
        """
        Executa o resgate de uma recompensa por um produtor.
        
        Fluxo de execução:
        1. Validar que recompensa existe, está ativa e tem estoque > 0
        2. Validar que produtor tem pontos suficientes
        3. Executar transação (debitar pontos + decrementar estoque + salvar histórico)
        4. Rollback automático em caso de falha
        
        Args:
            recompensa_id: ID da recompensa a ser resgatada
            produtor_id: ID do produtor que está resgatando
            
        Returns:
            ResgateResponse: Dados do resgate concluído
            
        Raises:
            HTTPException 404: Recompensa não encontrada ou produtor não encontrado
            HTTPException 400: Recompensa inativa, sem estoque ou pontos insuficientes
            HTTPException 500: Erro interno no processo de resgate
            
        Example:
            ```python
            resgate = await resgate_service.resgatar_recompensa(
                recompensa_id="60c72b2f9b1d4c3a4c8e4d3e",
                produtor_id="60c72b2f9b1d4c3a4c8e4d3f"
            )
            # ResgateResponse(id="...", pontos_gastos=500, data_resgate="2025-11-19T...")
            ```
        """
        # 1. Validar recompensa disponível
        recompensa = await self._validar_recompensa_disponivel(recompensa_id)
        pontos_necessarios = recompensa.get("pontos_necessarios", 0)
        
        # 2. Validar pontos do produtor
        await self._validar_pontos_produtor(produtor_id, pontos_necessarios)
        
        # 3. Executar transação com rollback automático
        resgate_id = await self._executar_transacao_resgate(
            recompensa_id, 
            produtor_id, 
            pontos_necessarios
        )
        
        # 4. Retornar resposta com dados do resgate
        return ResgateResponse(
            id=resgate_id,
            recompensa_id=recompensa_id,
            produtor_id=produtor_id,
            pontos_gastos=pontos_necessarios,
            data_resgate=datetime.utcnow()
        )
    
    async def listar_meus_resgates(
        self,
        produtor_id: str,
        skip: int = DEFAULT_SKIP,
        limit: int = MAX_LIMIT
    ) -> List[ResgateResponse]:
        """
        Lista histórico de resgates de um produtor.
        
        Retorna lista ordenada por data decrescente (mais recente primeiro).
        
        Args:
            produtor_id: ID do produtor
            skip: Número de registros a pular (paginação)
            limit: Número máximo de registros a retornar
            
        Returns:
            List[ResgateResponse]: Lista de resgates do produtor
            
        Example:
            ```python
            resgates = await resgate_service.listar_meus_resgates(produtor_id="123", limit=10)
            # [
            #   ResgateResponse(id="1", pontos_gastos=500, data_resgate="2025-11-19"),
            #   ResgateResponse(id="2", pontos_gastos=200, data_resgate="2025-11-15"),
            # ]
            ```
        """
        # Validar paginação
        skip, limit = self._validar_paginacao(skip, limit)
        
        # Buscar resgates do produtor
        resgates_db = await listar_por_produtor(produtor_id, limit=limit, skip=skip)
        
        # Converter para ResgateResponse
        return [ResgateResponse(**r) for r in resgates_db]
