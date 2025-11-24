from typing import Any, Dict, List, Optional
from datetime import datetime
from fastapi import HTTPException

from src.infra.database.repositories import (
    coleta_repo,
    residue_repo,
    scheduling_repo,
    user_repo,
)
import asyncio
from src.service.ranking_service import RankingService

from src.schemas.coleta_schema import (
    ColetaInDBSchema,
)

from src.schemas.residue_schema import (
    ResidueResponse,
)

from src.infra.database.models.enums import (
    StatusResiduo, 
    EstadoColeta,
    StatusAgendamento
)

class ColetaService:
    """
    Service responsável por orquestrar a lógica de negócio de coletas.

    Fluxo principal (Sprint 1.2):
    - Aceitar coleta (cria Coleta, reserva resíduos)
    - Iniciar coleta (PENDENTE -> EM_ANDAMENTO)
    - Coletar resíduo (RESERVADO -> COLETADO)
    - Rejeitar resíduo (RESERVADO -> REJEITADO e remove da lista)
    - Cancelar antes do local (PENDENTE -> CANCELADA; RESERVADO -> AGENDADO)
    - Cancelar após chegar (EM_ANDAMENTO -> CANCELADA; RESERVADO -> CANCELADO)
    """

    # ==================== AÇÕES PRINCIPAIS ====================

    async def aceitar_coleta(
        self,
        agendamento_id: str,
        residuos_ids: List[str],
        coletor_id: str,
    ) -> ColetaInDBSchema:
        """
        Cria uma nova coleta e reserva os resíduos selecionados.

        Regras de negócio:
        - Agendamento existe e está PENDENTE
        - Todos resíduos existem e estão AGENDADO
        - Todos resíduos pertencem ao agendamento
        - **Coleta Integral**: Se agendamento tem coleta_integral=True,
          o coletor DEVE aceitar TODOS os resíduos. Coleta parcial será rejeitada
          com HTTP 400.
        - **Coleta Parcial**: Se agendamento tem coleta_integral=False (padrão),
          o coletor pode aceitar apenas alguns resíduos.
        - Cria Coleta em estado PENDENTE
        - Atualiza resíduos para RESERVADO (Observer em residue_repo)
        
        Args:
            agendamento_id: ID do agendamento a ser aceito
            residuos_ids: Lista de IDs dos resíduos que o coletor deseja coletar
            coletor_id: ID do usuário coletor autenticado
        
        Returns:
            ColetaInDBSchema: Dados da coleta criada
        
        Raises:
            HTTPException 404: Agendamento não encontrado
            HTTPException 400: Agendamento não está PENDENTE
            HTTPException 400: Coleta integral exige todos os resíduos
            HTTPException 400: Resíduo não pertence ao agendamento
            HTTPException 404: Resíduo não encontrado
            HTTPException 409: Resíduo não está AGENDADO
        """
        agendamento = await scheduling_repo.find_by_id(agendamento_id)
        if not agendamento:
            raise HTTPException(404, "Agendamento não encontrado")

        if agendamento.get("status") != StatusAgendamento.PENDENTE:
            raise HTTPException(400, "Agendamento não está PENDENTE")

        # ============================================================
        # VALIDAÇÃO DE COLETA INTEGRAL
        # ============================================================
        # Quando o produtor marca um agendamento como "coleta_integral=True",
        # significa que TODOS os resíduos devem ser coletados juntos.
        #
        # Se coleta_integral=False (padrão), o coletor pode escolher
        # coletar apenas alguns resíduos (coleta parcial).
        # ============================================================
        agendamento_residuos: List[str] = agendamento.get("residuosId", [])
        coleta_integral: bool = agendamento.get("coleta_integral", False)
        
        if coleta_integral and len(residuos_ids) < len(agendamento_residuos):
            raise HTTPException(
                400,
                "Este agendamento exige coleta integral. Todos os resíduos devem ser coletados."
            )

        # Validar pertencimento e status dos resíduos
        for rid in residuos_ids:
            if rid not in agendamento_residuos:
                raise HTTPException(400, f"Resíduo {rid} não pertence ao agendamento")

            residuo = await residue_repo.find_by_id(rid)
            if not residuo:
                raise HTTPException(404, f"Resíduo {rid} não encontrado")
            if residuo.get("status") != StatusResiduo.AGENDADO:
                raise HTTPException(409, f"Resíduo {rid} não está AGENDADO")

        # Montar documento da coleta
        coleta_doc: Dict[str, Any] = {
            "agendamento_id": agendamento_id,
            "produtor_id": agendamento.get("produtorId"),
            "coletor_id": coletor_id,
            "residuos_id": list(residuos_ids),
            "data_hora": datetime.utcnow(),
            "local": agendamento.get("local") or {},
            "observacoes": None,
            "estado": EstadoColeta.PENDENTE,
        }

        coleta_id = await coleta_repo.create_coleta(coleta_doc)

        # Atualizar resíduos para RESERVADO (Observer registra histórico)
        for rid in residuos_ids:
            await residue_repo.atualizar_status(
                residuo_id=rid,
                novo_status=StatusResiduo.RESERVADO,
                usuario_id=coletor_id,
                detalhes={
                    "agendamento_id": agendamento_id,
                    "coleta_id": coleta_id,
                    "acao": "aceitar_coleta",
                },
            )

        criada = await coleta_repo.find_by_id(coleta_id)
        if not criada:
            raise HTTPException(500, "Erro ao recuperar coleta criada")
        return ColetaInDBSchema(**criada)

    async def iniciar_coleta(
        self,
        coleta_id: str,
        coletor_id: str,
    ) -> ColetaInDBSchema:
        """
        Marca coleta como EM_ANDAMENTO (coletor chegou no local).
        Atualiza data_hora para o momento atual (início da verificação).
        
        Nota: Os resíduos são adicionados ao inventory apenas quando 
        efetivamente coletados via coletar_residuo().
        """
        coleta = await coleta_repo.find_by_id(coleta_id)
        if not coleta:
            raise HTTPException(404, "Coleta não encontrada")
        if coleta.get("coletor_id") != coletor_id:
            raise HTTPException(403, "Você não pode iniciar esta coleta")
        if coleta.get("estado") != EstadoColeta.PENDENTE:
            raise HTTPException(400, "Somente coletas PENDENTE podem ser iniciadas")

        ok = await coleta_repo.update_coleta(
            coleta_id,
            {"estado": EstadoColeta.EM_ANDAMENTO, "data_hora": datetime.utcnow()},
        )
        if not ok:
            raise HTTPException(500, "Erro ao atualizar coleta")

        atual = await coleta_repo.find_by_id(coleta_id)
        if not atual:
            raise HTTPException(500, "Erro ao recuperar coleta atualizada")
        return ColetaInDBSchema(**atual)

    async def coletar_residuo(
        self,
        coleta_id: str,
        residuos_ids: List[str],
        coletor_id: str,
        observacao: Optional[str] = None,
    ) -> ColetaInDBSchema:
        """
        Marca um ou mais resíduos como COLETADO, mantém seus IDs em residuos_id
        e adiciona ao inventory do coletor (resíduos fisicamente coletados).
        """
        coleta = await coleta_repo.find_by_id(coleta_id)
        if not coleta:
            raise HTTPException(404, "Coleta não encontrada")
        if coleta.get("coletor_id") != coletor_id:
            raise HTTPException(403, "Você não pode alterar esta coleta")
        if coleta.get("estado") != EstadoColeta.EM_ANDAMENTO:
            raise HTTPException(400, "Coleta deve estar EM_ANDAMENTO para coletar resíduos")

        coleta_residuos = coleta.get("residuos_id") or []
        
        # Validar todos os resíduos antes de processar
        for residuo_id in residuos_ids:
            if residuo_id not in coleta_residuos:
                raise HTTPException(400, f"Resíduo {residuo_id} não pertence à coleta")

            residuo = await residue_repo.find_by_id(residuo_id)
            if not residuo:
                raise HTTPException(404, f"Resíduo {residuo_id} não encontrado")
            if residuo.get("status") != StatusResiduo.RESERVADO:
                raise HTTPException(409, f"Resíduo {residuo_id} não está RESERVADO")

        # Atualizar status de todos os resíduos para COLETADO
        for residuo_id in residuos_ids:
            await residue_repo.atualizar_status(
                residuo_id=residuo_id,
                novo_status=StatusResiduo.COLETADO,
                usuario_id=coletor_id,
                detalhes={"coleta_id": coleta_id, "acao": "coletar_residuo"},
            )

        # Adicionar pontos dos resíduos para o Produtor
        produtores_atualizados = set()
        for residuo_id in residuos_ids:
            residuo = await residue_repo.find_by_id(residuo_id)
            if not residuo:
                continue
            
            # Buscar produtor associado ao resíduo
            produtor_id = residuo.get("produtorId")
            if not produtor_id:
                continue

            pontos_residuo = residuo.get("valorEstimado", 0)
            
            # Atualizar points (saldo atual - pode aumentar/diminuir)
            sucesso_points = await user_repo.atualizar_pontos(
                user_id=produtor_id,
                pontos_delta=pontos_residuo
            )
            
            # Atualizar ranking (acumulador - só aumenta, nunca decresce)
            # Buscar ranking atual do produtor
            produtor = await user_repo.find_by_id(produtor_id)
            if produtor:
                ranking_atual = produtor.get("ranking", 0)
                novo_ranking = ranking_atual + pontos_residuo
                
                sucesso_ranking = await user_repo.update_ranking(
                    user_id=produtor_id,
                    new_ranking=novo_ranking
                )
                
                if sucesso_points and sucesso_ranking:
                    # Memorizar produtor para atualizar rankings após loop
                    produtores_atualizados.add(produtor_id)
            
        # Atualizar rankings dos produtores que tiveram pontos alterados.
        # Vamos atualizar o ranking global e também o ranking por estado/cidade
        # para cada produtor afetado.
        if produtores_atualizados:
            # Evita atualizações duplicadas: global apenas uma vez
            tasks = []
            # Atualizar ranking global uma vez
            tasks.append(RankingService.refresh_ranking(level="global"))

            # Recarregar ranking por região para cada produtor (estado e cidade)
            for pid in produtores_atualizados:
                produtor = await user_repo.find_by_id(pid)
                if not produtor:
                    continue
                estado = produtor.get("estado_id")
                cidade = produtor.get("cidade_id")
                # Atualizar ranking estadual (se existir)
                if estado:
                    tasks.append(RankingService.refresh_ranking(level="estado", code=estado))
                # Atualizar ranking por cidade (se existir)
                if cidade:
                    tasks.append(RankingService.refresh_ranking(level="cidade", code=cidade))

            # Executa atualizações de forma concorrente
            await asyncio.gather(*tasks)

        # Adicionar resíduos coletados ao inventory do coletor
        await self._adicionar_residuos_ao_inventory(coletor_id, residuos_ids)

        # Anexar observação se houver
        if observacao:
            await coleta_repo.append_observacao(coleta_id, observacao)

        # Verificar conclusão do agendamento
        await self._verificar_conclusao_agendamento(coleta.get("agendamento_id"))

        atual = await coleta_repo.find_by_id(coleta_id)
        if not atual:
            raise HTTPException(500, "Erro ao recuperar coleta atualizada")
        return ColetaInDBSchema(**atual)

    async def rejeitar_residuo(
        self,
        coleta_id: str,
        residuos_ids: List[str],
        coletor_id: str,
        motivo: str,
    ) -> ColetaInDBSchema:
        """
        Marca um ou mais resíduos como REJEITADO e remove seus IDs da coleta.
        """
        if not motivo:
            raise HTTPException(400, "Motivo é obrigatório para rejeitar resíduo")

        coleta = await coleta_repo.find_by_id(coleta_id)
        if not coleta:
            raise HTTPException(404, "Coleta não encontrada")
        if coleta.get("coletor_id") != coletor_id:
            raise HTTPException(403, "Você não pode alterar esta coleta")
        if coleta.get("estado") != EstadoColeta.EM_ANDAMENTO:
            raise HTTPException(400, "Coleta deve estar EM_ANDAMENTO para rejeitar resíduos")

        coleta_residuos = coleta.get("residuos_id") or []

        # Validar todos os resíduos antes de processar
        for residuo_id in residuos_ids:
            if residuo_id not in coleta_residuos:
                raise HTTPException(400, f"Resíduo {residuo_id} não pertence à coleta")

            residuo = await residue_repo.find_by_id(residuo_id)
            if not residuo:
                raise HTTPException(404, f"Resíduo {residuo_id} não encontrado")
            if residuo.get("status") != StatusResiduo.RESERVADO:
                raise HTTPException(409, f"Resíduo {residuo_id} não está RESERVADO")

        # Atualizar status e remover cada resíduo
        for residuo_id in residuos_ids:
            # Atualiza status do resíduo para REJEITADO
            await residue_repo.atualizar_status(
                residuo_id=residuo_id,
                novo_status=StatusResiduo.REJEITADO,
                usuario_id=coletor_id,
                detalhes={"coleta_id": coleta_id, "acao": "rejeitar_residuo", "motivo": motivo},
            )

            # Remove o ID do resíduo da coleta
            await coleta_repo.remove_residuo(coleta_id, residuo_id)

            # Anexa motivo às observações da coleta
            await coleta_repo.append_observacao(coleta_id, f"REJEITADO {residuo_id}: {motivo}")

            # Verifica se a lista de resíduos da coleta está vazia
            atual_coleta = await coleta_repo.find_by_id(coleta_id)
            if atual_coleta and not atual_coleta.get("residuos_id"):
                # Se vazia, marca coleta como CANCELADA
                await coleta_repo.update_estado(coleta_id, EstadoColeta.CANCELADA)
                await coleta_repo.append_observacao(coleta_id, "Coleta cancelada automaticamente após rejeição de todos os resíduos.")

        # Verificar conclusão do agendamento
        await self._verificar_conclusao_agendamento(coleta.get("agendamento_id"))

        atual = await coleta_repo.find_by_id(coleta_id)
        if not atual:
            raise HTTPException(500, "Erro ao recuperar coleta atualizada")
        return ColetaInDBSchema(**atual)

    async def cancelar_coleta_antes_local(
        self,
        coleta_id: str,
        coletor_id: str,
        motivo: str,
    ) -> ColetaInDBSchema:
        """
        Cancela coleta ANTES de chegar ao local (PENDENTE -> CANCELADA) e libera resíduos (RESERVADO -> AGENDADO).
        """
        coleta = await coleta_repo.find_by_id(coleta_id)
        if not coleta:
            raise HTTPException(404, "Coleta não encontrada")
        if coleta.get("coletor_id") != coletor_id:
            raise HTTPException(403, "Você não pode cancelar esta coleta")
        if coleta.get("estado") != EstadoColeta.PENDENTE:
            raise HTTPException(400, "A coleta precisa estar PENDENTE para cancelamento antes do local")

        # Atualiza coleta para CANCELADA
        await coleta_repo.update_estado(coleta_id, EstadoColeta.CANCELADA)
        if motivo:
            await coleta_repo.append_observacao(coleta_id, f"CANCELADA (antes do local): {motivo}")

        # Libera os resíduos: RESERVADO -> AGENDADO
        for rid in coleta.get("residuos_id", []):
            await residue_repo.atualizar_status(
                residuo_id=rid,
                novo_status=StatusResiduo.AGENDADO,
                usuario_id=coletor_id,
                detalhes={"coleta_id": coleta_id, "acao": "cancelar_antes_local"},
            )

        atual = await coleta_repo.find_by_id(coleta_id)
        if not atual:
            raise HTTPException(500, "Erro ao recuperar coleta atualizada")
        return ColetaInDBSchema(**atual)

    async def cancelar_coleta_apos_local(
        self,
        coleta_id: str,
        coletor_id: str,
        motivo: str,
    ) -> ColetaInDBSchema:
        """
        Cancela coleta APÓS chegar ao local (EM_ANDAMENTO -> CANCELADA) e marca resíduos ainda RESERVADO como CANCELADO.
        Remove os resíduos da coleta do inventory do coletor.
        """
        coleta = await coleta_repo.find_by_id(coleta_id)
        if not coleta:
            raise HTTPException(404, "Coleta não encontrada")
        if coleta.get("coletor_id") != coletor_id:
            raise HTTPException(403, "Você não pode cancelar esta coleta")
        if coleta.get("estado") != "EM_ANDAMENTO":
            raise HTTPException(400, "A coleta precisa estar EM_ANDAMENTO para cancelamento após chegar ao local")

        # Remover resíduos do inventory do coletor
        residuos_ids = coleta.get("residuos_id", [])
        await self._remover_residuos_do_inventory(coletor_id, residuos_ids)

        await coleta_repo.update_estado(coleta_id, EstadoColeta.CANCELADA)
        if motivo:
            await coleta_repo.append_observacao(coleta_id, f"CANCELADA (após chegar): {motivo}")

        # Para cada resíduo ainda RESERVADO -> CANCELADO
        for rid in coleta.get("residuos_id", []):
            residuo = await residue_repo.find_by_id(rid)
            if residuo and residuo.get("status") == StatusResiduo.RESERVADO:
                await residue_repo.atualizar_status(
                    residuo_id=rid,
                    novo_status=StatusResiduo.DESCARTADO,
                    usuario_id=coletor_id,
                    detalhes={"coleta_id": coleta_id, "acao": "cancelar_apos_local"},
                )

        # Verificar conclusão do agendamento
        await self._verificar_conclusao_agendamento(coleta.get("agendamento_id"))

        atual = await coleta_repo.find_by_id(coleta_id)
        if not atual:
            raise HTTPException(500, "Erro ao recuperar coleta atualizada")
        return ColetaInDBSchema(**atual)

    async def cancelar_apos_chegar_local(
        self,
        coleta_id: str,
        coletor_id: str,
        motivo: str,
    ) -> ColetaInDBSchema:
        """
        Alias para cancelar_coleta_apos_local.
        Mantido para compatibilidade com testes e código existente.
        """
        return await self.cancelar_coleta_apos_local(coleta_id, coletor_id, motivo)

    async def listar_coletas_coletor(
        self,
        coletor_id: str,
        estado: Optional[str] = None,
        *,
        limit: int = 100,
        skip: int = 0,
    ) -> List[ColetaInDBSchema]:
        docs = await coleta_repo.find_by_coletor_and_estado(
            coletor_id=coletor_id, estado=estado, limit=limit, skip=skip
        )
        return [ColetaInDBSchema(**d) for d in docs]

    async def buscar_coleta(self, coleta_id: str, coletor_id: str) -> ColetaInDBSchema:
        coleta = await coleta_repo.find_by_id(coleta_id)
        if not coleta:
            raise HTTPException(404, "Coleta não encontrada")
        if coleta.get("coletor_id") != coletor_id:
            raise HTTPException(403, "Você não tem acesso a esta coleta")
        return ColetaInDBSchema(**coleta)

    # ==================== AUXILIARES ====================

    # Constante para evitar magic strings
    _INVENTORY_FIELD = "inventory"

    async def _get_coletor(self, coletor_id: str) -> Dict[str, Any]:
        """
        Busca coletor por ID e valida sua existência.
        Método auxiliar para evitar duplicação de código.
        
        Args:
            coletor_id: ID do coletor
            
        Returns:
            Dict com dados do coletor
            
        Raises:
            HTTPException 404: Se coletor não for encontrado
        """
        coletor = await user_repo.find_by_id(coletor_id)
        if not coletor:
            raise HTTPException(404, "Coletor não encontrado")
        return coletor

    async def _adicionar_residuos_ao_inventory(
        self,
        coletor_id: str,
        residuos_ids: List[str]
    ) -> None:
        """
        Adiciona resíduos ao inventory do coletor.
        
        Args:
            coletor_id: ID do coletor
            residuos_ids: Lista de IDs de resíduos a serem adicionados
        """
        coletor = await self._get_coletor(coletor_id)
        
        # Pegar inventory atual (ou inicializar como lista vazia)
        inventory_atual = coletor.get(self._INVENTORY_FIELD, [])
        
        # Adicionar novos resíduos (evitar duplicatas)
        inventory_atualizado = list(set(inventory_atual + residuos_ids))
        
        # Atualizar no banco
        await user_repo.update_user(coletor_id, {self._INVENTORY_FIELD: inventory_atualizado})

    async def _remover_residuos_do_inventory(
        self,
        coletor_id: str,
        residuos_ids: List[str]
    ) -> None:
        """
        Remove resíduos do inventory do coletor.
        
        Args:
            coletor_id: ID do coletor
            residuos_ids: Lista de IDs de resíduos a serem removidos
        """
        coletor = await self._get_coletor(coletor_id)
        
        # Pegar inventory atual
        inventory_atual = coletor.get(self._INVENTORY_FIELD, [])
        
        # Remover os resíduos especificados
        inventory_atualizado = [rid for rid in inventory_atual if rid not in residuos_ids]
        
        # Atualizar no banco
        await user_repo.update_user(coletor_id, {self._INVENTORY_FIELD: inventory_atualizado})

    async def get_coletor_inventory(self, coletor_id: str) -> List[ResidueResponse]:
        """
        Retorna o inventory detalhado do coletor.
        
        Busca todos os resíduos que estão no inventory e retorna
        seus dados completos (quantidade, categoria, valor, foto, etc).
        
        Args:
            coletor_id: ID do coletor
            
        Returns:
            Lista de ResidueResponse com dados completos dos resíduos
        """
        coletor = await self._get_coletor(coletor_id)
        residuos_ids = coletor.get(self._INVENTORY_FIELD, [])
        
        # Se inventory vazio, retorna lista vazia
        if not residuos_ids:
            return []
        
        # Buscar dados completos de cada resíduo
        residuos_completos = []
        for residuo_id in residuos_ids:
            residuo = await residue_repo.find_by_id(residuo_id)
            if residuo:  # Só adiciona se encontrou (pode ter sido deletado)
                residuos_completos.append(ResidueResponse(**residuo))
        
        return residuos_completos

    async def _verificar_conclusao_agendamento(self, agendamento_id: Optional[str]):
        """
        Verifica se todos os resíduos do agendamento estão em estado final.
        Se sim, marca agendamento como CONCLUIDO.

        Estados finais: COLETADO, REJEITADO, ENTREGUE, DESCARTADO, CANCELADO
        """
        if not agendamento_id:
            return

        agendamento = await scheduling_repo.find_by_id(agendamento_id)
        if not agendamento:
            return

        residuos_ids: List[str] = agendamento.get("residuosId", [])
        if not residuos_ids:
            # Sem resíduos -> considerar concluído
            await scheduling_repo.update_status(agendamento_id, StatusAgendamento.CONCLUIDO)
            return

        finais = {StatusResiduo.COLETADO, StatusResiduo.REJEITADO, StatusResiduo.ENTREGUE, StatusResiduo.DESCARTADO}
        for rid in residuos_ids:
            r = await residue_repo.find_by_id(rid)
            if not r:
                # Se não existe mais, ignore (não marca como não finalizado)
                continue
            if r.get("status") not in finais:
                # Ainda há algum em AGENDADO/RESERVADO/...
                return

        # Se chegou aqui, todos estão finalizados
        await scheduling_repo.update_status(agendamento_id, StatusAgendamento.CONCLUIDO)
