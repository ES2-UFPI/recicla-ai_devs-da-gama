"""
Service de Entregas - Gerencia entrega de resíduos do coletor para receptora.

Este service implementa:
1. Criação de entregas (coletor -> receptora)
2. Atualização de status dos resíduos para ENTREGUE
3. Remoção de resíduos do inventário do coletor
4. Listagem de entregas com sumarização por categoria
5. Busca de receptoras próximas com cálculo de distância
"""
from typing import Dict, Any, List
from datetime import datetime
from collections import defaultdict
from math import radians, sin, cos, sqrt, atan2
from fastapi import HTTPException

from src.infra.database.repositories import entrega_repo
from src.infra.database.repositories import residue_repo
from src.infra.database.repositories import user_repo

from src.schemas.entrega_schema import (
    EntregaCreate,
    EntregaResponse,
    EntregaSumario,
    BuscarReceptorasRequest,
    ReceptoraComDistancia,
)

from src.infra.database.models.enums import StatusResiduo


class EntregaService:
    """
    Camada de serviço para lógica de negócio de entregas.
    Gerencia a entrega de resíduos do coletor para a receptora.
    """

    @staticmethod
    async def criar_entrega(coletor_id: str, entrega_payload: EntregaCreate) -> EntregaResponse:
        """
        Cria uma nova entrega de resíduos.
        
        Fluxo:
        1. Valida se coletor existe e tem inventory
        2. Valida se receptora existe
        3. Valida se todos os resíduos existem e estão no inventory do coletor
        4. Valida se resíduos têm status COLETADO
        5. Cria documento de entrega no BD
        6. Atualiza status dos resíduos para ENTREGUE
        7. Remove resíduos do inventory do coletor
        8. Retorna dados da entrega criada
        
        Args:
            coletor_id: ID do coletor que está fazendo a entrega
            entrega_payload: Dados da entrega (receptora, resíduos, observações)
            
        Returns:
            EntregaResponse: Dados da entrega criada
            
        Raises:
            HTTPException 404: Coletor ou receptora não encontrado
            HTTPException 400: Validação falhou (resíduo não no inventory, status inválido, etc)
        """
        # 1. Validar coletor existe e tem inventory
        coletor = await user_repo.find_by_id(coletor_id)
        if not coletor:
            raise HTTPException(
                status_code=404,
                detail=f"Coletor '{coletor_id}' não encontrado"
            )
        
        inventory = coletor.get("inventory", [])
        if not inventory:
            raise HTTPException(
                status_code=400,
                detail="Coletor não possui resíduos no inventário"
            )
        
        # 2. Validar receptora existe
        receptora = await user_repo.find_by_id(entrega_payload.receptora_id)
        if not receptora:
            raise HTTPException(
                status_code=404,
                detail=f"Receptora '{entrega_payload.receptora_id}' não encontrada"
            )
        
        if receptora.get("role_id") != "receptor":
            raise HTTPException(
                status_code=400,
                detail="O ID fornecido não pertence a uma receptora"
            )
        
        # 3 e 4. Validar resíduos existem, estão no inventory e têm status COLETADO
        categorias_entregues = []
        
        for residuo_id in entrega_payload.residuos_id:
            # Verificar se resíduo está no inventory do coletor
            if residuo_id not in inventory:
                raise HTTPException(
                    status_code=400,
                    detail=f"Resíduo '{residuo_id}' não está no inventário do coletor"
                )
            
            # Buscar dados do resíduo
            residuo = await residue_repo.find_by_id(residuo_id)
            if not residuo:
                raise HTTPException(
                    status_code=404,
                    detail=f"Resíduo '{residuo_id}' não encontrado"
                )
            
            # Validar status é COLETADO
            if residuo.get("status") != StatusResiduo.COLETADO:
                raise HTTPException(
                    status_code=400,
                    detail=f"Resíduo '{residuo_id}' não está com status COLETADO (atual: {residuo.get('status')})"
                )
            
            # Coletar categoria para registrar na entrega
            categoria_id = residuo.get("categoriaId")
            if categoria_id and categoria_id not in categorias_entregues:
                categorias_entregues.append(categoria_id)
        
        # 5. Criar documento de entrega
        entrega_doc: Dict[str, Any] = {
            "data_hora": datetime.utcnow(),
            "receptora_id": entrega_payload.receptora_id,
            "coletor_id": coletor_id,
            "residuos_id": entrega_payload.residuos_id,
            "categorias_residuos_entregues": categorias_entregues,
            "observacoes": entrega_payload.observacoes,
        }
        
        entrega_id = await entrega_repo.create_entrega(entrega_doc)
        
        # 6. Atualizar status dos resíduos para ENTREGUE
        for residuo_id in entrega_payload.residuos_id:
            await residue_repo.atualizar_status(
                residuo_id=residuo_id,
                novo_status=StatusResiduo.ENTREGUE,
                usuario_id=coletor_id,
                detalhes={
                    "entrega_id": entrega_id,
                    "receptora_id": entrega_payload.receptora_id,
                    "data_entrega": entrega_doc["data_hora"].isoformat()
                }
            )
        
        # 7. Remover resíduos do inventory do coletor
        await EntregaService._remover_residuos_do_inventory(
            coletor_id=coletor_id,
            residuos_ids=entrega_payload.residuos_id
        )
        
        # 8. Retornar entrega criada
        entrega_criada = await entrega_repo.find_by_id(entrega_id)
        if not entrega_criada:
            raise HTTPException(500, "Erro ao recuperar entrega criada")
        
        return EntregaResponse(**entrega_criada)
    
    @staticmethod
    async def listar_entregas_coletor(
        coletor_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[EntregaResponse]:
        """
        Lista todas as entregas de um coletor.
        
        Args:
            coletor_id: ID do coletor
            skip: Quantidade de registros a pular (paginação)
            limit: Quantidade máxima de registros
            
        Returns:
            Lista de entregas do coletor
        """
        entregas = await entrega_repo.find_by_coletor_id(
            coletor_id, 
            limit=limit, 
            skip=skip
        )
        return [EntregaResponse(**e) for e in entregas]
    
    @staticmethod
    async def obter_sumario_entregas(coletor_id: str) -> List[EntregaSumario]:
        """
        Retorna sumarização das entregas por categoria e tipo de medida.
        
        Agrupa todas as entregas do coletor, separa por categoriaId e tipo_medida,
        e soma as quantidades totais.
        
        Exemplo de retorno:
        [
            {"categoriaId": "plastico", "tipo_medida": "kg", "quantidade_total": 150.5},
            {"categoriaId": "papel", "tipo_medida": "unidade", "quantidade_total": 75.0}
        ]
        
        Args:
            coletor_id: ID do coletor
            
        Returns:
            Lista de sumarizações por categoria e tipo de medida
        """
        # Buscar todas as entregas do coletor
        entregas = await entrega_repo.find_by_coletor_id(coletor_id, limit=10000, skip=0)
        
        # Dicionário para acumular quantidades: (categoriaId, tipo_medida) -> quantidade_total
        sumario: Dict[tuple, float] = defaultdict(float)
        
        # Percorrer todas as entregas e seus resíduos
        for entrega in entregas:
            residuos_ids = entrega.get("residuos_id", [])
            
            for residuo_id in residuos_ids:
                # Buscar dados completos do resíduo
                residuo = await residue_repo.find_by_id(residuo_id)
                if not residuo:
                    continue
                
                categoria_id = residuo.get("categoriaId")
                tipo_medida = residuo.get("tipo_medida")
                quantidade = residuo.get("quantidade", 0.0)
                
                if categoria_id and tipo_medida:
                    chave = (categoria_id, tipo_medida)
                    sumario[chave] += quantidade
        
        # Converter para lista de EntregaSumario
        resultado = [
            EntregaSumario(
                categoriaId=categoria_id,
                tipo_medida=tipo_medida,
                quantidade_total=quantidade_total
            )
            for (categoria_id, tipo_medida), quantidade_total in sumario.items()
        ]
        
        return resultado
    
    # ==================== MÉTODO AUXILIAR ====================
    
    @staticmethod
    async def _remover_residuos_do_inventory(
        coletor_id: str,
        residuos_ids: List[str]
    ) -> None:
        """
        Remove resíduos do inventory do coletor.
        
        Implementação idêntica ao ColetaService para manter consistência.
        
        Args:
            coletor_id: ID do coletor
            residuos_ids: Lista de IDs de resíduos a serem removidos
        """
        coletor = await user_repo.find_by_id(coletor_id)
        if not coletor:
            raise HTTPException(404, f"Coletor '{coletor_id}' não encontrado")
        
        # Pegar inventory atual
        inventory_atual = coletor.get("inventory", [])
        
        # Remover os resíduos especificados
        inventory_atualizado = [rid for rid in inventory_atual if rid not in residuos_ids]
        
        # Atualizar no banco
        await user_repo.update_user(coletor_id, {"inventory": inventory_atualizado})
    
    # ==================== MÉTODOS DE BUSCA DE RECEPTORAS ====================
    
    @staticmethod
    def _calcular_distancia_haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
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
        """
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
    async def buscar_receptoras_proximas(
        filtros: BuscarReceptorasRequest,
        current_user: Dict[str, Any]
    ) -> List[ReceptoraComDistancia]:
        """
        Busca receptoras próximas dentro de um raio de localização.
        
        Algoritmo:
        1. Valida que usuário é coletor
        2. Busca todas as receptoras no banco de dados
        3. Para cada receptora:
           - Calcula distância usando Haversine baseado no primeiro endereço
           - Filtra por raio especificado
           - Opcionalmente filtra por materiais aceitos
        4. Ordena por distância (mais próximas primeiro)
        5. Retorna lista com informações da receptora + distância

        Args:
            filtros: Parâmetros de busca (lat, lon, raio, materiais_aceitos)
            current_user: Usuário autenticado (deve ser role "coletor")
        
        Returns:
            Lista de receptoras com distância calculada,
            ordenadas da mais próxima para a mais distante
            
        Raises:
            HTTPException: 
                - 403 se usuário não for coletor
        """
        # Verificar se usuário é coletor
        user_role = current_user.get("role_id")
        if user_role != "coletor":
            raise HTTPException(
                status_code=403,
                detail="Apenas coletores podem buscar receptoras próximas"
            )
        
        # Buscar todas as receptoras do sistema
        # Como não há método específico no user_repo, vamos usar o MongoDB diretamente
        from src.infra.database.config.database import get_database
        db = get_database()
        users_collection = db["users"]
        
        # Query para buscar apenas usuários com role "receptor"
        receptoras_cursor = users_collection.find({"role_id": "receptor"})
        receptoras = await receptoras_cursor.to_list(length=None)
        
        if not receptoras:
            return []
        
        # Calcular distância e filtrar por raio
        receptoras_com_distancia = []
        
        for receptora in receptoras:
            # Pegar endereços da receptora
            addresses = receptora.get("addresses", [])
            if not addresses:
                continue  # Pular receptoras sem endereço
            
            # Usar o primeiro endereço para calcular distância
            primeiro_endereco = addresses[0]
            lat_receptora = primeiro_endereco.get("latitude")
            lon_receptora = primeiro_endereco.get("longitude")
            
            # Validar se coordenadas existem
            if not lat_receptora or not lon_receptora:
                continue
            
            try:
                lat_receptora = float(lat_receptora)
                lon_receptora = float(lon_receptora)
            except (ValueError, TypeError):
                continue  # Coordenadas inválidas
            
            # Calcular distância
            distancia = EntregaService._calcular_distancia_haversine(
                filtros.latitude,
                filtros.longitude,
                lat_receptora,
                lon_receptora
            )
            
            # Filtrar por raio
            if distancia > filtros.raio:
                continue  # Fora do raio especificado
            
            # Filtrar por materiais aceitos (se especificado)
            if filtros.materiais_aceitos:
                materiais_receptora = receptora.get("accepted_material", [])
                # Verificar se a receptora aceita pelo menos um dos materiais solicitados
                if not any(material in materiais_receptora for material in filtros.materiais_aceitos):
                    continue  # Não aceita nenhum dos materiais
            
            # Adicionar à lista com distância
            receptoras_com_distancia.append({
                "receptora": receptora,
                "distancia_km": round(distancia, 2)
            })
        
        # Ordenar por distância (mais próxima primeiro)
        receptoras_com_distancia.sort(key=lambda x: x["distancia_km"])
        
        # Montar resposta
        resultado = []
        for item in receptoras_com_distancia:
            receptora = item["receptora"]
            resultado.append(
                ReceptoraComDistancia(
                    id=str(receptora.get("_id")),
                    name=receptora.get("name", ""),
                    email=receptora.get("email", ""),
                    phone=receptora.get("phone", ""),
                    accepted_material=receptora.get("accepted_material", []),
                    addresses=receptora.get("addresses", []),
                    distancia_km=item["distancia_km"]
                )
            )
        
        return resultado
