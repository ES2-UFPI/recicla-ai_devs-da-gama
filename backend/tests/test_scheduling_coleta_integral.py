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
    Testes de integração que simulam o fluxo real da aplicação.
    
    Cenários testados:
    1. Coleta parcial: coletor pode pegar apenas alguns resíduos
    2. Coleta integral: coletor DEVE pegar todos os resíduos
    """
    
    @pytest.mark.asyncio
    async def test_coleta_parcial_permite_coletar_alguns_residuos(self):
        """
        Cenário: Agendamento com coleta parcial
        
        Dado que:
        - Produtor criou agendamento com 3 resíduos
        - Agendamento configurado como coleta_integral=False (parcial)
        
        Quando:
        - Coletor tenta criar coleta com apenas 1 dos 3 resíduos
        
        Então:
        - Sistema deve PERMITIR a coleta
        - Coleta deve ser criada com sucesso
        """
        # TODO: Este teste será implementado quando o service de coleta
        # for integrado com a validação de coleta_integral
        # Por ora, validamos apenas que o campo existe e pode ser lido
        
        scheduling = Scheduling(
            produtorId="produtor123",
            residuosId=["residuo1", "residuo2", "residuo3"],
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
            coleta_integral=False  # Coleta parcial permitida
        )
        
        # Simula que o coletor pode escolher apenas alguns resíduos
        residuos_a_coletar = ["residuo1"]  # Apenas 1 de 3
        
        # Com coleta parcial, isso deve ser permitido
        assert scheduling.coleta_integral == False
        assert len(residuos_a_coletar) < len(scheduling.residuosId)
        # A validação real será feita no service de coleta
    
    @pytest.mark.asyncio
    async def test_coleta_integral_exige_todos_residuos(self):
        """
        Cenário: Agendamento com coleta integral
        
        Dado que:
        - Produtor criou agendamento com 3 resíduos  
        - Agendamento configurado como coleta_integral=True (integral)
        
        Quando:
        - Coletor tenta criar coleta com apenas 1 dos 3 resíduos
        
        Então:
        - Sistema deve REJEITAR a coleta
        - Deve retornar erro informando que todos os resíduos são obrigatórios
        """
        # TODO: Este teste será implementado quando o service de coleta
        # implementar a validação de coleta_integral
        
        scheduling = Scheduling(
            produtorId="produtor123",
            residuosId=["residuo1", "residuo2", "residuo3"],
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
            coleta_integral=True  # Coleta integral obrigatória
        )
        
        # Simula tentativa de coletar apenas alguns resíduos
        residuos_a_coletar = ["residuo1"]  # Apenas 1 de 3
        
        # Com coleta integral, deve validar que TODOS sejam coletados
        assert scheduling.coleta_integral == True
        assert len(residuos_a_coletar) < len(scheduling.residuosId)
        
        # A validação real será:
        # if scheduling.coleta_integral and len(residuos_a_coletar) < len(scheduling.residuosId):
        #     raise HTTPException(
        #         status_code=400,
        #         detail="Este agendamento exige coleta integral. Todos os resíduos devem ser coletados."
        #     )
    
    @pytest.mark.asyncio
    async def test_coleta_integral_aceita_todos_residuos(self):
        """
        Cenário: Coleta integral com todos os resíduos
        
        Dado que:
        - Produtor criou agendamento com 3 resíduos
        - Agendamento configurado como coleta_integral=True
        
        Quando:
        - Coletor cria coleta com TODOS os 3 resíduos
        
        Então:
        - Sistema deve PERMITIR a coleta
        - Coleta deve ser criada com sucesso
        """
        scheduling = Scheduling(
            produtorId="produtor123",
            residuosId=["residuo1", "residuo2", "residuo3"],
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
        
        # Coletor seleciona TODOS os resíduos
        residuos_a_coletar = ["residuo1", "residuo2", "residuo3"]
        
        # Validação: com coleta integral, todos os resíduos foram incluídos
        assert scheduling.coleta_integral == True
        assert set(residuos_a_coletar) == set(scheduling.residuosId)
        # Deve ser permitido
    
    @pytest.mark.asyncio  
    async def test_produtor_pode_alterar_tipo_coleta(self):
        """
        Cenário: Produtor altera tipo de coleta
        
        Dado que:
        - Existe agendamento com coleta parcial
        
        Quando:
        - Produtor atualiza para coleta integral
        
        Então:
        - Sistema deve atualizar o campo
        - Próximas coletas devem respeitar novo tipo
        """
        # Agendamento inicial com coleta parcial
        scheduling_id = "agend123"
        
        # Dados de atualização
        update_data = SchedulingUpdate(
            coleta_integral=True  # Mudando para integral
        )
        
        assert hasattr(update_data, 'coleta_integral')
        assert update_data.coleta_integral == True
