from typing import Any, Dict, List, Optional
from fastapi import HTTPException
from math import radians, sin, cos, sqrt, atan2

from src.infra.database.repositories import scheduling_repo, user_repo, residue_repo
from src.infra.database.models.scheduling import Scheduling
from src.schemas.scheduling_schema import (
    SchedulingCreate,
    SchedulingUpdate,
    SchedulingInDB,
    LocalEndereco,
    BuscarAgendamentosRequest,
    AgendamentoComDistancia,
)

from src.infra.database.models.enums import StatusResiduo, StatusAgendamento

class SchedulingService:
    """
    Camada de serviço responsável por CRUD de agendamentos.
    """

    async def _buscar_endereco_produtor(self, produtor_id: str, address_id: int) -> Dict[str, Any]:
        """
        Busca o endereço completo do produtor pelo ID.
        
        Args:
            produtor_id: ID do produtor
            address_id: ID do endereço no array de addresses do produtor
        
        Returns:
            Dict com os dados do endereço
            
        Raises:
            HTTPException: Se produtor ou endereço não encontrado
        """
        # Buscar usuário produtor
        usuario = await user_repo.find_by_id(produtor_id)
        if not usuario:
            raise HTTPException(404, "Produtor não encontrado")
        
        # Buscar endereço específico
        addresses = usuario.get("addresses", [])
        endereco = next((addr for addr in addresses if addr.get("id") == address_id), None)
        
        if not endereco:
            raise HTTPException(
                404, 
                f"Endereço com ID {address_id} não encontrado no perfil do produtor"
            )
        
        # Montar objeto LocalEndereco
        return {
            "address_id": endereco.get("id"),
            "apelido": endereco.get("apelido"),
            "cep": endereco.get("cep"),
            "logradouro": endereco.get("logradouro"),
            "numero": endereco.get("numero"),
            "complemento": endereco.get("complemento"),
            "latitude": endereco.get("latitude"),
            "longitude": endereco.get("longitude"),
        }

    async def criar_agendamento(self, dados: SchedulingCreate, produtor_id: str) -> SchedulingInDB:
        """
        Cria um novo agendamento.

        Args:
            dados: Dados do agendamento (sem produtorId, com address_id)
            produtor_id: ID do usuário autenticado

        Regras:
        - Define status padrão (PENDENTE) via model
        - Evita duplicidade de PENDENTE por resíduo
        - produtorId é obtido automaticamente do usuário autenticado
        - Valida slots de disponibilidade (horários e datas)
        - Busca endereço completo do produtor pelo address_id
        """
        # Opcional: impedir mais de um agendamento PENDENTE por resíduo
        for residuo_id in dados.residuosId:
            existente = await scheduling_repo.find_pending_for_residuo(residuo_id)
            if existente:
                raise HTTPException(409, "Já existe agendamento PENDENTE para um dos resíduos informados.")

        # Buscar endereço completo do produtor
        local_dict = await self._buscar_endereco_produtor(produtor_id, dados.address_id)
        
        # Converter slots de disponibilidade para formato de armazenamento (lista de dicts)
        disponibilidade_dicts = [slot.model_dump() for slot in dados.disponibilidade]
        
        # Monta objeto de domínio e persiste
        scheduling_obj = Scheduling(
            produtorId=produtor_id,  # Usa o ID do usuário autenticado
            residuosId=dados.residuosId,
            disponibilidade=disponibilidade_dicts,  # Armazena como lista de dicts
            local=local_dict,  # Armazena endereço completo como dict
            observacoes=dados.observacoes,
        )
        doc = scheduling_obj.model_dump(by_alias=True, exclude_none=True)
        # Remover id se vier como None para evitar problemas
        doc.pop("_id", None)

        new_id = await scheduling_repo.create_scheduling(doc)
        
        # 🔔 PADRÃO OBSERVER: Atualizar status dos resíduos para AGENDADO
        # Quando um agendamento é criado, os resíduos associados mudam de estado
        for residuo_id in dados.residuosId:
            try:
                await residue_repo.atualizar_status(
                    residuo_id=residuo_id,
                    novo_status=StatusResiduo.AGENDADO,
                    usuario_id=produtor_id,
                    detalhes={
                        "agendamento_id": new_id,
                        "acao": "agendamento_criado",
                        "produtor_id": produtor_id
                    }
                )
            except Exception as e:
                # Log do erro mas não falha a criação do agendamento
                # Em produção, usar logger adequado
                print(f"Erro ao atualizar status do resíduo {residuo_id}: {str(e)}")
        
        criado = await scheduling_repo.find_by_id(new_id)
        if not criado:
            raise HTTPException(500, "Erro ao recuperar agendamento criado")
        return SchedulingInDB(**criado)

    async def obter_agendamento(
        self, 
        scheduling_id: str, 
        current_user: Dict[str, Any]
    ) -> SchedulingInDB:
        """
        Obtém um agendamento por ID.
        
        Regras de autorização:
        - Produtor: pode ver apenas seus próprios agendamentos
        - Cooperativa/Reciclador: pode ver qualquer agendamento (para aceitar coletas)
        - Admin: pode ver qualquer agendamento
        """
        achado = await scheduling_repo.find_by_id(scheduling_id)
        if not achado:
            raise HTTPException(404, "Agendamento não encontrado")
        
        user_role = current_user.get("role_id")
        user_id = current_user.get("id")
        
        # Produtores só podem ver seus próprios agendamentos
        if user_role == "produtor" and achado.get("produtorId") != user_id:
            raise HTTPException(403, "Você só pode visualizar seus próprios agendamentos")
        
        return SchedulingInDB(**achado)

    async def listar_agendamentos(
        self,
        *,
        produtorId: Optional[str] = None,
        residuoId: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
        skip: int = 0,
        current_user: Dict[str, Any]
    ) -> List[SchedulingInDB]:
        """
        Lista agendamentos com filtros opcionais.
        
        Regras de autorização:
        - Produtor: lista apenas seus próprios agendamentos (ignora filtro produtorId)
        - Cooperativa/Reciclador: lista todos os agendamentos (para aceitar coletas)
        - Admin: lista todos os agendamentos
        """
        filters: Dict[str, Any] = {}
        
        user_role = current_user.get("role_id")
        user_id = current_user.get("id")
        
        # Produtores só podem listar seus próprios agendamentos
        if user_role == "produtor":
            filters["produtorId"] = user_id  # Força filtro pelo próprio ID
        else:
            # Cooperativas/Recicladores/Admin podem filtrar por produtor
            if produtorId:
                filters["produtorId"] = produtorId
        
        if residuoId:
            filters["residuosId"] = residuoId
        if status:
            filters["status"] = status

        docs = await scheduling_repo.list_schedules(filters=filters or None, limit=limit, skip=skip)
        return [SchedulingInDB(**d) for d in docs]

    # Verificar futuramente se os status dos resíduos são modificados também
    async def atualizar_agendamento(
        self, 
        scheduling_id: str, 
        dados: SchedulingUpdate,
        current_user: Dict[str, Any]
    ) -> SchedulingInDB:
        """
        Atualiza campos editáveis do agendamento (residuosId, disponibilidade, local, observacoes).
        Status deve ser alterado por método dedicado (atualizar_status).
        
        Regras de autorização:
        - Produtor: pode editar apenas seus próprios agendamentos
        - Cooperativa/Reciclador: NÃO pode editar (apenas mudar status)
        - Admin: pode editar qualquer agendamento
        """
        atual = await scheduling_repo.find_by_id(scheduling_id)
        if not atual:
            raise HTTPException(404, "Agendamento não encontrado")
        
        user_role = current_user.get("role_id")
        user_id = current_user.get("id")
        
        # Cooperativas/Recicladores não podem editar agendamentos
        if user_role in ["cooperativa", "reciclador"]:
            raise HTTPException(403, "Cooperativas e recicladores não podem editar agendamentos. Use o endpoint de atualização de status.")
        
        # Produtores só podem editar seus próprios agendamentos
        if user_role == "produtor" and atual.get("produtorId") != user_id:
            raise HTTPException(403, "Você só pode editar seus próprios agendamentos")

        updates = dados.model_dump(exclude_unset=True)
        if not updates:
            return SchedulingInDB(**atual)
        
        # Converter disponibilidade para formato de armazenamento se fornecida
        if dados.disponibilidade is not None:
            updates["disponibilidade"] = [slot.model_dump() for slot in dados.disponibilidade]
        
        # Buscar novo endereço se address_id foi fornecido
        if dados.address_id is not None:
            produtor_id_agendamento = atual.get("produtorId")
            if not produtor_id_agendamento:
                raise HTTPException(500, "Agendamento sem produtorId")
            local_dict = await self._buscar_endereco_produtor(produtor_id_agendamento, dados.address_id)
            updates["local"] = local_dict

        ok = await scheduling_repo.update_scheduling(scheduling_id, updates)
        if not ok:
            raise HTTPException(500, "Erro ao atualizar agendamento")

        atualizado = await scheduling_repo.find_by_id(scheduling_id)
        if not atualizado:
            raise HTTPException(500, "Erro ao recuperar agendamento atualizado")
        return SchedulingInDB(**atualizado)

    async def atualizar_status(
        self, 
        scheduling_id: str, 
        novo_status: str,
        current_user: Dict[str, Any]
    ) -> SchedulingInDB:
        """
        Atualiza apenas o status do agendamento.
        
        Regras de autorização:
        - Produtor: pode atualizar status dos próprios agendamentos (ex: CANCELADO)
        - Cooperativa/Reciclador: pode atualizar status de qualquer agendamento (CONFIRMADO, EM_ANDAMENTO, CONCLUÍDO)
        - Admin: pode atualizar status de qualquer agendamento
        """
        atual = await scheduling_repo.find_by_id(scheduling_id)
        if not atual:
            raise HTTPException(404, "Agendamento não encontrado")
        
        user_role = current_user.get("role_id")
        user_id = current_user.get("id")
        
        # Produtores só podem atualizar status dos próprios agendamentos
        if user_role == "produtor" and atual.get("produtorId") != user_id:
            raise HTTPException(403, "Você só pode atualizar o status dos seus próprios agendamentos")

        ok = await scheduling_repo.update_status(scheduling_id, novo_status)
        if not ok:
            raise HTTPException(500, "Erro ao atualizar status do agendamento")

        # 🔔 PADRÃO OBSERVER: Atualizar status dos resíduos quando agendamento é cancelado
        # Se o agendamento foi CANCELADO, os resíduos voltam para DISPONIVEL
        if novo_status.upper() == "CANCELADO":
            residuos_ids = atual.get("residuosId", [])
            for residuo_id in residuos_ids:
                try:
                    await residue_repo.atualizar_status(
                        residuo_id=residuo_id,
                        novo_status="DISPONIVEL",
                        usuario_id=str(user_id) if user_id else "sistema",
                        detalhes={
                            "agendamento_id": scheduling_id,
                            "acao": "agendamento_cancelado",
                            "usuario_id": str(user_id) if user_id else "sistema"
                        }
                    )
                except Exception as e:
                    print(f"Erro ao atualizar status do resíduo {residuo_id}: {str(e)}")

        atualizado = await scheduling_repo.find_by_id(scheduling_id)
        if not atualizado:
            raise HTTPException(500, "Erro ao recuperar agendamento atualizado")
        return SchedulingInDB(**atualizado)

    async def deletar_agendamento(
        self, 
        scheduling_id: str,
        current_user: Dict[str, Any]
    ) -> bool:
        """
        Deleta um agendamento por ID.
        
        Regras de autorização:
        - Produtor: pode deletar apenas seus próprios agendamentos
        - Cooperativa/Reciclador: NÃO pode deletar agendamentos
        - Admin: pode deletar qualquer agendamento
        
        Efeitos colaterais:
        - Os resíduos associados voltam ao status DISPONIVEL
        """
        atual = await scheduling_repo.find_by_id(scheduling_id)
        if not atual:
            raise HTTPException(404, "Agendamento não encontrado")
        
        user_role = current_user.get("role_id")
        user_id = current_user.get("id")
        
        # Cooperativas/Recicladores não podem deletar agendamentos
        if user_role in ["cooperativa", "reciclador"]:
            raise HTTPException(403, "Cooperativas e recicladores não podem deletar agendamentos")
        
        # Produtores só podem deletar seus próprios agendamentos
        if user_role == "produtor" and atual.get("produtorId") != user_id:
            raise HTTPException(403, "Você só pode deletar seus próprios agendamentos")

        # 🔔 PADRÃO OBSERVER: Reverter status dos resíduos para DISPONIVEL
        # Quando um agendamento é deletado, os resíduos associados voltam a estar disponíveis
        residuos_ids = atual.get("residuosId", [])
        for residuo_id in residuos_ids:
            try:
                await residue_repo.atualizar_status(
                    residuo_id=residuo_id,
                    novo_status=StatusResiduo.DISPONIVEL,
                    usuario_id=user_id
                )
            except Exception as e:
                # Log do erro mas não falha a deleção do agendamento
                # Em produção, usar logger adequado
                print(f"⚠️ Erro ao reverter status do resíduo {residuo_id}: {str(e)}")

        ok = await scheduling_repo.delete_scheduling(scheduling_id)
        if not ok:
            raise HTTPException(500, "Erro ao deletar agendamento")
        return True

    @staticmethod
    def _calcular_distancia_haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        '''
        Calcula a distância em quilômetros entre duas coordenadas geográficas.
        Utiliza a fórmula de Haversine para calcular a distância great-circle.

        Args:
            lat1: Latitude do ponto 1 (graus)
            lon1: Longitude do ponto 1 (graus)
            lat2: Latitude do ponto 2 (graus)
            lon2: Longitude do ponto 2 (graus)
        
        Returns:
            float: Distância em quilômetros

        Referência: https://en.wikipedia.org/wiki/Haversine_formula
        '''
        # Raio da Terra em quilômetros
        R = 6371.0
        
        # Converter de graus para radianos
        lat1_rad = radians(lat1)
        lon1_rad = radians(lon1)
        lat2_rad = radians(lat2)
        lon2_rad = radians(lon2)
        
        # Diferenças
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        # Fórmula de Haversine
        a = sin(dlat / 2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2)**2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        
        distancia = R * c
        return distancia

    @staticmethod
    def _agendamento_disponivel_no_horario(
        disponibilidade: list[dict[str, Any]], 
        data_busca: str, 
        hora_busca: str
    ) -> bool:
        """
        Verifica se o agendamento está disponível na data/hora especificada.
        
        Um agendamento é considerado disponível se:
        - Existe um slot com a data exata da busca
        - A hora da busca está entre hora_inicio e hora_fim desse slot
        
        Args:
            disponibilidade: Lista de slots de disponibilidade do agendamento
                Exemplo: [{"data": "22/10/2025", "hora_inicio": "10:30", "hora_fim": "18:00"}]
            data_busca: Data atual (formato dd/mm/aaaa)
            hora_busca: Hora atual (formato hh:mm)
        
        Returns:
            bool: True se agendamento está disponível naquele momento, False caso contrário
        
        Exemplo:
            >>> slots = [{"data": "22/10/2025", "hora_inicio": "10:30", "hora_fim": "18:00"}]
            >>> _agendamento_disponivel_no_horario(slots, "22/10/2025", "15:00")
            True
            >>> _agendamento_disponivel_no_horario(slots, "22/10/2025", "09:00")
            False
            >>> _agendamento_disponivel_no_horario(slots, "23/10/2025", "15:00")
            False
        """
        from datetime import datetime
        
        try:
            # Converter data e hora de busca para datetime
            data_busca_dt = datetime.strptime(data_busca, "%d/%m/%Y")
            hora_busca_dt = datetime.strptime(hora_busca, "%H:%M").time()
            
            # Verificar cada slot de disponibilidade
            for slot in disponibilidade:
                slot_data = slot.get("data")
                slot_hora_inicio = slot.get("hora_inicio")
                slot_hora_fim = slot.get("hora_fim")
                
                # Validar se slot tem os campos necessários
                if not all([slot_data, slot_hora_inicio, slot_hora_fim]):
                    continue
                
                try:
                    # Converter data do slot
                    slot_data_dt = datetime.strptime(slot_data, "%d/%m/%Y")
                    
                    # Verificar se é o mesmo dia
                    if slot_data_dt.date() != data_busca_dt.date():
                        continue  # Não é o mesmo dia, próximo slot
                    
                    # Converter horários do slot
                    slot_inicio_dt = datetime.strptime(slot_hora_inicio, "%H:%M").time()
                    slot_fim_dt = datetime.strptime(slot_hora_fim, "%H:%M").time()
                    
                    # Verificar se hora de busca está dentro do intervalo
                    # hora_inicio <= hora_busca < hora_fim
                    if slot_inicio_dt <= hora_busca_dt < slot_fim_dt:
                        return True  # Encontrou slot disponível!
                
                except (ValueError, TypeError):
                    # Slot com formato inválido, ignorar e tentar próximo
                    continue
            
            # Nenhum slot disponível encontrado
            return False
        
        except (ValueError, TypeError):
            # Data/hora de busca inválida
            return False

    async def buscar_agendamentos_disponiveis(
        self, 
        filtros: BuscarAgendamentosRequest,
        current_user: Dict[str, Any]
    ) -> List[AgendamentoComDistancia]:
        """
        Busca agendamentos disponíveis (PENDENTE) dentro de um raio de localização
        e que estejam disponíveis no momento da busca.
        
        VERSÃO OTIMIZADA: Usa query geoespacial no MongoDB para filtrar por distância
        diretamente no banco de dados, evitando buscar e processar documentos desnecessários.
        
        Algoritmo:
        1. Valida que usuário é coletor
        2. Usa aggregation pipeline do MongoDB para:
           - Filtrar status PENDENTE
           - Calcular distância (Haversine) no banco
           - Filtrar por raio
           - Ordenar por distância
        3. Filtra agendamentos disponíveis no horário especificado (data_busca/hora_busca)
        4. Se categorias_ids fornecido: filtra agendamentos com resíduos dessas categorias
        5. Busca informações completas dos resíduos
        6. Retorna lista ordenada

        Args:
            filtros: Parâmetros de busca (lat, lon, raio, data, hora, categorias)
            current_user: Usuário autenticado (deve ser role "coletor")
        
        Returns:
            Lista de agendamentos com distância e dados completos dos resíduos,
            filtrados por: status PENDENTE, distância, horário disponível e categorias
            
        Raises:
            HTTPException: 
                - 403 se usuário não for coletor
        """
        # Verificar se usuário é coletor
        user_role = current_user.get("role_id")
        if user_role != "coletor":
            raise HTTPException(
                403, 
                "Apenas coletores podem buscar agendamentos disponíveis"
            )
        
        # 1. Buscar agendamentos PENDENTES próximos usando query geoespacial
        # Filtro por distância é feito NO BANCO DE DADOS
        agendamentos_proximos = await scheduling_repo.find_pendentes_por_proximidade(
            latitude=filtros.latitude,
            longitude=filtros.longitude,
            raio_km=filtros.raio,
            limit=100  # Limitar resultados para não sobrecarregar
        )
        
        if not agendamentos_proximos:
            return []
        
        # 2. Filtrar por disponibilidade temporal, categorias e buscar resíduos
        agendamentos_com_residuos = []
        
        for agendamento in agendamentos_proximos:
            # FILTRO TEMPORAL: Verificar se agendamento está disponível no horário
            disponibilidade = agendamento.get("disponibilidade", [])
            
            if not self._agendamento_disponivel_no_horario(
                disponibilidade, 
                filtros.data_busca, 
                filtros.hora_busca
            ):
                # Agendamento não está disponível neste horário, pular
                continue
            
            residuos_ids = agendamento.get("residuosId", [])

            # Buscar resíduos do agendamento
            residuos: List[Dict[str, Any]] = []
            for residuo_id in residuos_ids:
                residuo = await residue_repo.find_by_id(residuo_id)
                if residuo:
                    residuos.append(residuo)

            # ÚLTIMO FILTRO: manter apenas resíduos com status AGENDADO
            residuos_agendados = [
                r for r in residuos
                if r.get("status") == StatusResiduo.AGENDADO
            ]

            # Se não houver resíduos AGENDADO, não exibir este agendamento
            if not residuos_agendados:
                continue
            
            # Se filtro de categorias foi fornecido
            if filtros.categorias_ids:
                # Verificar se algum resíduo pertence às categorias desejadas
                tem_categoria_desejada = any(
                    residuo.get("categoriaId") in filtros.categorias_ids
                    for residuo in residuos_agendados
                )
                
                # Só inclui se tiver resíduo da categoria desejada
                if tem_categoria_desejada:
                    agendamentos_com_residuos.append({
                        "agendamento": agendamento,
                        "residuos": residuos_agendados
                    })
            else:
                # Sem filtro de categoria, inclui todos
                agendamentos_com_residuos.append({
                    "agendamento": agendamento,
                    "residuos": residuos_agendados
                })
        
        # 3. Montar resposta
        # Nota: agendamentos já vêm ordenados por distância do repository
        resultado = []
        for item in agendamentos_com_residuos:
            agendamento = item["agendamento"]
            # distancia_km já vem calculada do aggregation pipeline
            distancia = agendamento.pop("distancia_km", 0.0)
            
            resultado.append(AgendamentoComDistancia(
                **agendamento,
                distancia_km=round(distancia, 2),
                residuos=item["residuos"]
            ))
        
        return resultado
