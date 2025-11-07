"""
Testes para Issue #121 - Coleta Integral/Parcial

Estes testes validam a funcionalidade que permite ao produtor escolher 
se a coleta deve ser integral (todos os resíduos obrigatórios) ou 
parcial (coletor pode escolher alguns resíduos).
"""
import pytest
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException

from src.infra.database.models.scheduling import Scheduling
from src.schemas.scheduling_schema import (
    SchedulingCreate,
    SchedulingUpdate,
    SchedulingInDB,
    DisponibilidadeSlot
)
from src.service.scheduling_service import SchedulingService


class TestColetaIntegralModel:
    """Testes unitários para o campo coleta_integral no Model Scheduling"""
    
    def test_scheduling_deve_ter_campo_coleta_integral(self):
        """
        Verifica se o modelo Scheduling possui o campo coleta_integral.
        
        Garante que:
        - O atributo 'coleta_integral' existe no modelo
        - O tipo do campo é boolean
        """
        scheduling = Scheduling(
            produtorId="user123",
            residuosId=["residuo1"],
            disponibilidade=[{
                "data": "17/12/2025",
                "hora_inicio": "10:00",
                "hora_fim": "18:00"
            }],
            local={
                "address_id": 1,
                "cep": "64000-000",
                "logradouro": "Rua Exemplo",
                "numero": "123"
            }
        )
        
        assert hasattr(scheduling, 'coleta_integral'), \
            "Model Scheduling deve ter atributo 'coleta_integral'"
        assert isinstance(scheduling.coleta_integral, bool), \
            "Campo 'coleta_integral' deve ser do tipo boolean"
    
    def test_scheduling_coleta_integral_deve_ter_valor_padrao_false(self):
        """
        Verifica que o valor padrão de coleta_integral é False.
        
        Comportamento esperado:
        - Quando não especificado, assume coleta parcial (False)
        - Mantém compatibilidade retroativa com agendamentos existentes
        """
        scheduling = Scheduling(
            produtorId="user123",
            residuosId=["residuo1"],
            disponibilidade=[{
                "data": "17/12/2025",
                "hora_inicio": "10:00",
                "hora_fim": "18:00"
            }],
            local={
                "address_id": 1,
                "cep": "64000-000",
                "logradouro": "Rua Exemplo",
                "numero": "123"
            }
        )
        
        assert scheduling.coleta_integral == False, \
            "Valor padrão deve ser False (coleta parcial)"
    
    def test_scheduling_deve_aceitar_coleta_integral_true(self):
        """
        Verifica que é possível criar agendamento com coleta integral.
        
        Comportamento esperado:
        - Aceita coleta_integral=True
        - Armazena o valor corretamente
        """
        scheduling = Scheduling(
            produtorId="user123",
            residuosId=["residuo1", "residuo2"],
            disponibilidade=[{
                "data": "17/12/2025",
                "hora_inicio": "10:00",
                "hora_fim": "18:00"
            }],
            local={
                "address_id": 1,
                "cep": "64000-000",
                "logradouro": "Rua Exemplo",
                "numero": "123"
            },
            coleta_integral=True
        )
        
        assert scheduling.coleta_integral == True, \
            "Deve aceitar e armazenar coleta_integral=True"


class TestColetaIntegralSchemaCreate:
    """Testes unitários para o campo coleta_integral no Schema SchedulingCreate"""
    
    def test_scheduling_create_deve_ter_campo_coleta_integral(self):
        """
        Verifica que SchedulingCreate aceita o campo coleta_integral.
        """
        dados = SchedulingCreate(
            residuosId=["residuo1"],
            disponibilidade=[DisponibilidadeSlot(
                data="17/12/2025",
                hora_inicio="10:00",
                hora_fim="18:00"
            )],
            address_id=1,
            observacoes="Teste"
        )
        
        assert hasattr(dados, 'coleta_integral'), \
            "SchedulingCreate deve ter campo 'coleta_integral'"
    
    def test_scheduling_create_coleta_integral_padrao_false(self):
        """
        Verifica que o valor padrão de coleta_integral é False no schema de criação.
        """
        dados = SchedulingCreate(
            residuosId=["residuo1"],
            disponibilidade=[DisponibilidadeSlot(
                data="17/12/2025",
                hora_inicio="10:00",
                hora_fim="18:00"
            )],
            address_id=1,
            observacoes="Teste"
        )
        
        assert dados.coleta_integral == False, \
            "Valor padrão deve ser False quando não especificado"
    
    def test_scheduling_create_aceita_coleta_integral_true(self):
        """
        Verifica que produtor pode criar agendamento com coleta integral.
        """
        dados = SchedulingCreate(
            residuosId=["residuo1", "residuo2"],
            disponibilidade=[DisponibilidadeSlot(
                data="17/12/2025",
                hora_inicio="10:00",
                hora_fim="18:00"
            )],
            address_id=1,
            observacoes="Coleta integral obrigatória",
            coleta_integral=True
        )
        
        assert dados.coleta_integral == True, \
            "Deve aceitar coleta_integral=True"


class TestColetaIntegralSchemaUpdate:
    """Testes unitários para o campo coleta_integral no Schema SchedulingUpdate"""
    
    def test_scheduling_update_deve_aceitar_coleta_integral(self):
        """
        Verifica que produtor pode atualizar o tipo de coleta.
        """
        dados = SchedulingUpdate(
            coleta_integral=True
        )
        
        assert hasattr(dados, 'coleta_integral'), \
            "SchedulingUpdate deve ter campo 'coleta_integral'"
        assert dados.coleta_integral == True, \
            "Deve aceitar e armazenar valor fornecido"
    
    def test_scheduling_update_coleta_integral_opcional(self):
        """
        Verifica que coleta_integral é opcional no update.
        
        Permite atualizar outros campos sem modificar tipo de coleta.
        """
        dados = SchedulingUpdate(
            observacoes="Nova observação"
        )
        
        assert hasattr(dados, 'coleta_integral'), \
            "Campo deve existir mesmo quando não fornecido"


class TestColetaIntegralSchemaInDB:
    """Testes unitários para o campo coleta_integral no Schema SchedulingInDB"""
    
    def test_scheduling_indb_deve_ter_coleta_integral(self):
        """
        Verifica que a resposta da API inclui o campo coleta_integral.
        """
        dados = SchedulingInDB(
            _id="scheduling123",
            produtorId="user123",
            residuosId=["residuo1"],
            disponibilidade=[{
                "data": "17/12/2025",
                "hora_inicio": "10:00",
                "hora_fim": "18:00"
            }],
            local={
                "address_id": 1,
                "cep": "64000-000",
                "logradouro": "Rua Exemplo",
                "numero": "123"
            },
            status="PENDENTE"
        )
        
        assert hasattr(dados, 'coleta_integral'), \
            "SchedulingInDB deve ter campo 'coleta_integral'"
    
    def test_scheduling_indb_retorna_coleta_integral_corretamente(self):
        """
        Verifica que o valor de coleta_integral é retornado corretamente.
        """
        dados = SchedulingInDB(
            _id="scheduling123",
            produtorId="user123",
            residuosId=["residuo1", "residuo2"],
            disponibilidade=[{
                "data": "17/12/2025",
                "hora_inicio": "10:00",
                "hora_fim": "18:00"
            }],
            local={
                "address_id": 1,
                "cep": "64000-000",
                "logradouro": "Rua Exemplo",
                "numero": "123"
            },
            status="PENDENTE",
            coleta_integral=True
        )
        
        assert dados.coleta_integral == True, \
            "Deve retornar o valor fornecido corretamente"


class TestColetaIntegralSerializacao:
    """Testes para serialização do campo coleta_integral"""
    
    def test_model_dump_inclui_coleta_integral(self):
        """
        Verifica que a serialização inclui o campo coleta_integral.
        
        Garante que:
        - model_dump() retorna o campo 'coleta_integral'
        - O valor serializado está correto
        """
        scheduling = Scheduling(
            produtorId="user123",
            residuosId=["residuo1"],
            disponibilidade=[{
                "data": "17/12/2025",
                "hora_inicio": "10:00",
                "hora_fim": "18:00"
            }],
            local={
                "address_id": 1,
                "cep": "64000-000",
                "logradouro": "Rua Exemplo",
                "numero": "123"
            },
            coleta_integral=True
        )
        
        dados_dict = scheduling.model_dump()
        
        assert 'coleta_integral' in dados_dict, \
            "Serialização deve incluir campo 'coleta_integral'"
        assert dados_dict['coleta_integral'] == True, \
            "Valor serializado deve estar correto"

# Teste de Fluxo
class TestColetaIntegralFluxoCompleto:
    """
    Testes de integração REAIS que validam a lógica de negócio no ColetaService.
    Usa mocks para simular repositories e testa o comportamento do método aceitar_coleta.
    """
    
    @pytest.mark.asyncio
    async def test_coleta_parcial_permite_coletar_alguns_residuos(self, mocker):
        """
        Cenário: Agendamento com coleta parcial permite aceitar apenas alguns resíduos.
        
        Dado que:
        - Agendamento tem 3 resíduos e coleta_integral=False
        
        Quando:
        - Coletor tenta aceitar apenas 2 dos 3 resíduos
        
        Então:
        - Sistema PERMITE (coleta criada com sucesso)
        """
        from src.service.coleta_service import ColetaService
        from src.infra.database.models.enums import StatusAgendamento, StatusResiduo
        from datetime import datetime
        
        # Mock do agendamento com coleta_integral=False
        mock_agendamento = {
            "_id": "agend123",
            "produtorId": "prod123",
            "residuosId": ["res1", "res2", "res3"],
            "status": StatusAgendamento.PENDENTE,
            "coleta_integral": False,  # Permite coleta parcial
            "local": {"latitude": -5.0892, "longitude": -42.8019},
        }
        
        # Mock dos resíduos (todos AGENDADO)
        mock_residuos = [
            {"_id": "res1", "status": StatusResiduo.AGENDADO},
            {"_id": "res2", "status": StatusResiduo.AGENDADO},
        ]
        
        # Mock da coleta criada (com todos os campos obrigatórios)
        mock_coleta = {
            "_id": "coleta123",
            "id": "coleta123",
            "agendamento_id": "agend123",
            "produtor_id": "prod123",
            "coletor_id": "coletor456",
            "residuos_id": ["res1", "res2"],
            "data_hora": datetime.utcnow(),
            "local": {"latitude": -5.0892, "longitude": -42.8019},
            "estado": "PENDENTE",
        }
        
        # Configurar mocks
        mocker.patch("src.service.coleta_service.scheduling_repo.find_by_id", return_value=mock_agendamento)
        mocker.patch("src.service.coleta_service.residue_repo.find_by_id", side_effect=mock_residuos)
        mocker.patch("src.service.coleta_service.coleta_repo.create_coleta", return_value="coleta123")
        mocker.patch("src.service.coleta_service.coleta_repo.find_by_id", return_value=mock_coleta)
        mocker.patch("src.service.coleta_service.residue_repo.atualizar_status")
        
        # Executar
        service = ColetaService()
        resultado = await service.aceitar_coleta(
            agendamento_id="agend123",
            residuos_ids=["res1", "res2"],  # Apenas 2 dos 3 resíduos
            coletor_id="coletor456"
        )
        
        # Validar: não deve lançar exceção, coleta criada com sucesso
        assert resultado.agendamento_id == "agend123"
        assert len(resultado.residuos_id) == 2
    
    @pytest.mark.asyncio
    async def test_coleta_integral_exige_todos_residuos(self, mocker):
        """
        Cenário: Agendamento com coleta integral REJEITA coleta parcial.
        
        Dado que:
        - Agendamento tem 3 resíduos e coleta_integral=True
        
        Quando:
        - Coletor tenta aceitar apenas 2 dos 3 resíduos
        
        Então:
        - Sistema REJEITA com HTTPException 400
        - Mensagem de erro deve mencionar "integral"
        """
        from src.service.coleta_service import ColetaService
        from src.infra.database.models.enums import StatusAgendamento
        from fastapi import HTTPException
        
        # Mock do agendamento com coleta_integral=True
        mock_agendamento = {
            "_id": "agend123",
            "produtorId": "prod123",
            "residuosId": ["res1", "res2", "res3"],
            "status": StatusAgendamento.PENDENTE,
            "coleta_integral": True,  # EXIGE coleta integral
            "local": {"latitude": -5.0892, "longitude": -42.8019},
        }
        
        # Configurar mock
        mocker.patch("src.service.coleta_service.scheduling_repo.find_by_id", return_value=mock_agendamento)
        
        # Executar e validar exceção
        service = ColetaService()
        with pytest.raises(HTTPException) as exc_info:
            await service.aceitar_coleta(
                agendamento_id="agend123",
                residuos_ids=["res1", "res2"],  # Apenas 2 dos 3 resíduos
                coletor_id="coletor456"
            )
        
        # Validar erro HTTP 400 com mensagem sobre coleta integral
        assert exc_info.value.status_code == 400
        assert "integral" in exc_info.value.detail.lower()
    
    @pytest.mark.asyncio
    async def test_coleta_integral_aceita_todos_residuos(self, mocker):
        """
        Cenário: Agendamento com coleta integral ACEITA quando todos resíduos são selecionados.
        
        Dado que:
        - Agendamento tem 3 resíduos e coleta_integral=True
        
        Quando:
        - Coletor aceita TODOS os 3 resíduos
        
        Então:
        - Sistema PERMITE (coleta criada com sucesso)
        """
        from src.service.coleta_service import ColetaService
        from src.infra.database.models.enums import StatusAgendamento, StatusResiduo
        from datetime import datetime
        
        # Mock do agendamento com coleta_integral=True
        mock_agendamento = {
            "_id": "agend123",
            "produtorId": "prod123",
            "residuosId": ["res1", "res2", "res3"],
            "status": StatusAgendamento.PENDENTE,
            "coleta_integral": True,  # Exige coleta integral
            "local": {"latitude": -5.0892, "longitude": -42.8019},
        }
        
        # Mock dos resíduos (todos AGENDADO)
        mock_residuos = [
            {"_id": "res1", "status": StatusResiduo.AGENDADO},
            {"_id": "res2", "status": StatusResiduo.AGENDADO},
            {"_id": "res3", "status": StatusResiduo.AGENDADO},
        ]
        
        # Mock da coleta criada (com todos os campos obrigatórios)
        mock_coleta = {
            "_id": "coleta123",
            "id": "coleta123",
            "agendamento_id": "agend123",
            "produtor_id": "prod123",
            "coletor_id": "coletor456",
            "residuos_id": ["res1", "res2", "res3"],
            "data_hora": datetime.utcnow(),
            "local": {"latitude": -5.0892, "longitude": -42.8019},
            "estado": "PENDENTE",
        }
        
        # Configurar mocks
        mocker.patch("src.service.coleta_service.scheduling_repo.find_by_id", return_value=mock_agendamento)
        mocker.patch("src.service.coleta_service.residue_repo.find_by_id", side_effect=mock_residuos)
        mocker.patch("src.service.coleta_service.coleta_repo.create_coleta", return_value="coleta123")
        mocker.patch("src.service.coleta_service.coleta_repo.find_by_id", return_value=mock_coleta)
        mocker.patch("src.service.coleta_service.residue_repo.atualizar_status")
        
        # Executar
        service = ColetaService()
        resultado = await service.aceitar_coleta(
            agendamento_id="agend123",
            residuos_ids=["res1", "res2", "res3"],  # TODOS os 3 resíduos
            coletor_id="coletor456"
        )
        
        # Validar: sucesso, coleta criada com todos os resíduos
        assert resultado.agendamento_id == "agend123"
        assert len(resultado.residuos_id) == 3
    
    @pytest.mark.asyncio  
    async def test_produtor_pode_alterar_tipo_coleta(self):
        """
        Cenário: Schema permite atualização do tipo de coleta
        
        Dado que:
        - Existe um agendamento
        
        Quando:
        - Produtor atualiza apenas o campo coleta_integral
        
        Então:
        - SchedulingUpdate deve aceitar a mudança (campo opcional)
        """
        # Dados de atualização (apenas coleta_integral)
        update_data = SchedulingUpdate(
            coleta_integral=True  # Mudando para integral
        )
        
        # Validar que o campo foi aceito
        assert update_data.coleta_integral == True
        
        # Validar que outros campos são opcionais
        assert update_data.residuosId is None
        assert update_data.disponibilidade is None

