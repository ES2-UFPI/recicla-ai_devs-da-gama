"""
Service de Resíduos - Orquestra a lógica de negócio do módulo de resíduos.

Este service é responsável por:
- Validar regras de negócio antes de persistir dados
- Orquestrar múltiplos repositories (residue, categoria, historico)
- Aplicar padrões de projeto (Factory Method, Observer)
- Garantir consistência entre resíduo e seu histórico

IMPORTANTE: Controllers NÃO devem chamar repositories diretamente!
Sempre use este service como intermediário.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import HTTPException

from src.infra.database.repositories import residue_repo, categoria_repo, historico_repo
from src.infra.database.models.models import CategoriaResiduo, Residue, StatusResiduo
from src.schemas.residue_schema import (
    ResidueCreate, 
    ResidueResponse, 
    ResidueUpdate,
    ResidueStatusUpdate,
    HistoricoResiduoResponse
)


class ResiduoService:
    """
    Service de Resíduos.
    Centraliza toda a lógica de negócio relacionada a resíduos.
    """
    
    async def criar_residuo(self, produtor_id: str, dados: ResidueCreate) -> ResidueResponse:
        """
        Cria novo resíduo usando Factory Method.
        
        Fluxo:
        1. Valida se categoria existe e está ativa
        2. Usa Factory Method da categoria para criar resíduo (calcula valor automático)
        3. Persiste no banco
        4. Registra evento CRIADO no histórico (Observer Pattern)
        5. Retorna resíduo criado
        
        Args:
            produtor_id: ID do usuário produtor (vem do JWT)
            dados: Dados do resíduo (quantidade, foto, categoriaId)
        
        Returns:
            ResidueResponse: Resíduo criado com todos os dados
        
        Raises:
            HTTPException 404: Categoria não encontrada
            HTTPException 400: Categoria inativa
        """
        # 1. Validar categoria existe e está ativa
        categoria_doc = await categoria_repo.buscar_por_id(dados.categoriaId)
        if not categoria_doc:
            raise HTTPException(
                status_code=404, 
                detail=f"Categoria '{dados.categoriaId}' não encontrada"
            )
        
        if not categoria_doc.get("ativo", False):
            raise HTTPException(
                status_code=400, 
                detail=f"Categoria '{categoria_doc.get('tipo')}' está inativa"
            )
        
        # 2. Usar Factory Method para criar resíduo
        # Converte dict do MongoDB para objeto Pydantic
        categoria_obj = CategoriaResiduo(**categoria_doc)
        
        # Factory Method: cria resíduo com valor estimado calculado automaticamente
        residuo_obj = categoria_obj.criar_residuo(
            produtor_id=produtor_id,
            quantidade=dados.quantidade,
            tipo_medida=dados.tipo_medida,
            foto=dados.foto
        )
        
        # 3. Persistir no banco
        residuo_dict = residuo_obj.dict(by_alias=True, exclude={"id"})
        residuo_id = await residue_repo.create_residue(residuo_dict)
        
        # 4. Registrar histórico (Observer Pattern)
        # Sempre que um resíduo muda de estado, registramos no histórico
        await historico_repo.criar_historico({
            "residuo_id": residuo_id,
            "acao": StatusResiduo.DISPONIVEL,  # Primeiro estado
            "usuario_id": produtor_id,
            "data_acao": datetime.utcnow(),
            "detalhes": {
                "quantidade": dados.quantidade,
                "tipo_medida": dados.tipo_medida,
                "categoria": categoria_doc.get("tipo"),
                "valor_estimado": residuo_obj.valorEstimado
            }
        })
        
        # 5. Buscar e retornar (garante dados atualizados do banco)
        residuo_salvo = await residue_repo.find_by_id(residuo_id)
        if residuo_salvo:
            return ResidueResponse(**residuo_salvo)
        raise HTTPException(500, "Erro ao recuperar resíduo criado")
    
    
    async def listar_meus_residuos(
        self, 
        produtor_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[ResidueResponse]:
        """
        Lista todos os resíduos de um produtor específico.
        
        Args:
            produtor_id: ID do produtor (vem do JWT)
            skip: Quantidade de registros a pular (paginação)
            limit: Quantidade máxima de registros
        
        Returns:
            List[ResidueResponse]: Lista de resíduos do produtor
        """
        residuos = await residue_repo.find_by_produtor_id(
            produtor_id=produtor_id,
            skip=skip,
            limit=limit
        )
        return [ResidueResponse(**r) for r in residuos]
    
    
    async def obter_residuo(self, residuo_id: str, produtor_id: str) -> ResidueResponse:
        """
        Obtém detalhes de um resíduo específico.
        Valida se o resíduo pertence ao produtor.
        
        Args:
            residuo_id: ID do resíduo
            produtor_id: ID do produtor (validação de propriedade)
        
        Returns:
            ResidueResponse: Dados completos do resíduo
        
        Raises:
            HTTPException 404: Resíduo não encontrado
            HTTPException 403: Resíduo não pertence ao produtor
        """
        residuo = await residue_repo.find_by_id(residuo_id)
        if not residuo:
            raise HTTPException(404, "Resíduo não encontrado")
        
        # Validar propriedade
        if residuo.get("produtorId") != produtor_id:
            raise HTTPException(403, "Você não tem permissão para acessar este resíduo")
        
        return ResidueResponse(**residuo)
    
    
    async def atualizar_residuo(
        self, 
        residuo_id: str, 
        produtor_id: str, 
        dados: ResidueUpdate
    ) -> ResidueResponse:
        """
        Atualiza dados de um resíduo.
        
        Regras:
        - Apenas o produtor dono pode atualizar
        - Se mudar a categoria, recalcula o valor estimado
        - Se mudar a quantidade, recalcula o valor estimado
        - Registra mudança no histórico (Observer Pattern)
        
        Args:
            residuo_id: ID do resíduo
            produtor_id: ID do produtor (validação de propriedade)
            dados: Novos dados (quantidade, foto, categoriaId)
        
        Returns:
            ResidueResponse: Resíduo atualizado
        
        Raises:
            HTTPException 404: Resíduo ou categoria não encontrado
            HTTPException 403: Usuário não é o dono
        """
        # 1. Verificar se resíduo existe e pertence ao produtor
        residuo = await residue_repo.find_by_id(residuo_id)
        if not residuo:
            raise HTTPException(404, "Resíduo não encontrado")
        
        if residuo.get("produtorId") != produtor_id:
            raise HTTPException(403, "Você não pode editar este resíduo")
        
        # 2. Preparar updates
        updates = dados.dict(exclude_unset=True)  # Apenas campos fornecidos
        
        # 3. Se mudou categoria, validar e recalcular valor
        if "categoriaId" in updates:
            nova_categoria = await categoria_repo.buscar_por_id(updates["categoriaId"])
            if not nova_categoria:
                raise HTTPException(404, "Nova categoria não encontrada")
            
            # Recalcular valor estimado considerando tipo de medida
            quantidade = updates.get("quantidade", residuo.get("quantidade", 0))
            tipo_medida = updates.get("tipo_medida", residuo.get("tipo_medida", "kg"))
            
            if tipo_medida == "unidade":
                preco = nova_categoria.get("preco_por_unidade")
                if preco is None:
                    raise HTTPException(400, f"Categoria não possui preço por unidade configurado")
                updates["valorEstimado"] = float(quantidade) * float(preco)
            else:  # kg
                preco = nova_categoria.get("preco_por_kg", 0)
                updates["valorEstimado"] = float(quantidade) * float(preco)
        
        # 4. Se mudou quantidade ou tipo_medida (mas não categoria), recalcular valor
        elif "quantidade" in updates or "tipo_medida" in updates:
            categoria_id = residuo.get("categoriaId")
            if categoria_id:
                categoria_atual = await categoria_repo.buscar_por_id(str(categoria_id))
                if categoria_atual:
                    quantidade = updates.get("quantidade", residuo.get("quantidade", 0))
                    tipo_medida = updates.get("tipo_medida", residuo.get("tipo_medida", "kg"))
                    
                    if tipo_medida == "unidade":
                        preco = categoria_atual.get("preco_por_unidade")
                        if preco is None:
                            raise HTTPException(400, f"Categoria não possui preço por unidade configurado")
                        updates["valorEstimado"] = float(quantidade) * float(preco)
                    else:  # kg
                        preco = categoria_atual.get("preco_por_kg", 0)
                        updates["valorEstimado"] = float(quantidade) * float(preco)
        
        # 5. Atualizar com histórico (Observer Pattern)
        await residue_repo.update_residue_with_history(
            residuo_id=residuo_id,
            updates=updates,
            usuario_id=produtor_id,
            acao="ATUALIZADO",
            detalhes={
                "campos_alterados": list(updates.keys()),
                "valores_novos": updates
            }
        )
        
        # 6. Retornar atualizado
        residuo_atualizado = await residue_repo.find_by_id(residuo_id)
        if residuo_atualizado:
            return ResidueResponse(**residuo_atualizado)
        raise HTTPException(500, "Erro ao recuperar resíduo atualizado")
    
    
    async def deletar_residuo(self, residuo_id: str, produtor_id: str) -> bool:
        """
        Deleta um resíduo.
        
        Regras:
        - Apenas o produtor dono pode deletar
        - NÃO pode deletar resíduos COLETADOS ou ENTREGUES (validação no repo)
        
        Args:
            residuo_id: ID do resíduo
            produtor_id: ID do produtor (validação de propriedade)
        
        Returns:
            bool: True se deletou com sucesso
        
        Raises:
            HTTPException 404: Resíduo não encontrado
            HTTPException 403: Usuário não é o dono
            HTTPException 400: Resíduo já foi coletado/entregue
        """
        # 1. Verificar propriedade
        residuo = await residue_repo.find_by_id(residuo_id)
        if not residuo:
            raise HTTPException(404, "Resíduo não encontrado")
        
        if residuo.get("produtorId") != produtor_id:
            raise HTTPException(403, "Você não pode deletar este resíduo")
        
        # 2. Tentar deletar (validação de status está no repo)
        success = await residue_repo.delete_residue(residuo_id)
        
        if not success:
            # Se falhou, é porque o status não permite
            status = residuo.get("status", "DESCONHECIDO")
            raise HTTPException(
                400, 
                f"Não é possível deletar resíduo com status '{status}'. "
                "Apenas resíduos DISPONÍVEIS, AGENDADOS ou CANCELADOS podem ser deletados."
            )
        
        return True
    
    
    async def obter_historico(
        self, 
        residuo_id: str, 
        produtor_id: str
    ) -> List[HistoricoResiduoResponse]:
        """
        Retorna o histórico completo de um resíduo.
        Mostra todas as ações realizadas (linha do tempo).
        
        Args:
            residuo_id: ID do resíduo
            produtor_id: ID do produtor (validação de acesso)
        
        Returns:
            List[HistoricoResiduoResponse]: Histórico ordenado cronologicamente
        
        Raises:
            HTTPException 404: Resíduo não encontrado
            HTTPException 403: Usuário não tem acesso
        """
        # 1. Validar acesso ao resíduo
        residuo = await residue_repo.find_by_id(residuo_id)
        if not residuo:
            raise HTTPException(404, "Resíduo não encontrado")
        
        if residuo.get("produtorId") != produtor_id:
            raise HTTPException(403, "Você não tem acesso ao histórico deste resíduo")
        
        # 2. Buscar histórico
        historico = await historico_repo.obter_historico(residuo_id)
        
        return [HistoricoResiduoResponse(**h) for h in historico]
    
    
    async def atualizar_status(
        self,
        residuo_id: str,
        usuario_id: str,
        dados: ResidueStatusUpdate
    ) -> ResidueResponse:
        """
        Atualiza apenas o status de um resíduo.
        
        IMPORTANTE: Este método é usado pelo módulo de LOGÍSTICA!
        Não validamos propriedade aqui porque coletores também podem atualizar.
        
        Transições válidas:
        - DISPONIVEL → AGENDADO (quando coletor aceita)
        - AGENDADO → COLETADO (quando coletor coleta)
        - COLETADO → ENTREGUE (quando coletor entrega na receptora)
        - Qualquer → CANCELADO (produtor ou coletor cancela)
        
        Args:
            residuo_id: ID do resíduo
            usuario_id: ID de quem está atualizando (pode ser produtor ou coletor)
            dados: Novo status e detalhes
        
        Returns:
            ResidueResponse: Resíduo atualizado
        
        Raises:
            HTTPException 404: Resíduo não encontrado
        """
        # 1. Verificar se resíduo existe
        residuo = await residue_repo.find_by_id(residuo_id)
        if not residuo:
            raise HTTPException(404, "Resíduo não encontrado")
        
        # 2. Atualizar status (Observer Pattern registra histórico automaticamente)
        success = await residue_repo.atualizar_status(
            residuo_id=residuo_id,
            novo_status=dados.novo_status,
            usuario_id=usuario_id,
            detalhes=dados.detalhes
        )
        
        if not success:
            raise HTTPException(500, "Erro ao atualizar status do resíduo")
        
        # 3. Retornar atualizado
        residuo_atualizado = await residue_repo.find_by_id(residuo_id)
        if residuo_atualizado:
            return ResidueResponse(**residuo_atualizado)
        raise HTTPException(500, "Erro ao recuperar resíduo atualizado")
