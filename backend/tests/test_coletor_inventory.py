"""
Testes TDD para funcionalidade de Inventário do Coletor

Issue: Implementar inventory do coletor
Descrição: O coletor possui um atributo 'inventory' que guarda os IDs de 
todos os resíduos que ele coletou fisicamente (status COLETADO).

Regras de Negócio:
- inventory é uma lista de strings (IDs de resíduos)
- Deve conter apenas os resíduos que foram EFETIVAMENTE COLETADOS
- Quando um resíduo é coletado (ação coletar_residuo), ele é adicionado ao inventory
- Quando uma coleta é cancelada após iniciar, os resíduos coletados são removidos do inventory
- Resíduos rejeitados NUNCA entram no inventory (não foram fisicamente coletados)
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from bson import ObjectId
from datetime import datetime

from src.service.coleta_service import ColetaService
from src.infra.database.models.enums import EstadoColeta


class TestColetorInventory:
    """
    Testes para a funcionalidade de inventory do coletor.
    
    Valida que o inventory contém apenas resíduos efetivamente coletados,
    sendo atualizado ao coletar e ao cancelar coletas.
    """

    @pytest.mark.asyncio
    async def test_coletar_residuo_adiciona_ao_inventory(self):
        """
        Testa que ao coletar um resíduo (RESERVADO -> COLETADO), 
        ele é adicionado ao inventory do coletor.
        
        Given: Uma coleta EM_ANDAMENTO com 3 resíduos RESERVADO
        And: Coletor com inventory vazio
        When: O coletor coleta 2 resíduos
        Then: Os 2 IDs de resíduos devem ser adicionados ao inventory do coletor
        """
        # ARRANGE
        coleta_id = str(ObjectId())
        coletor_id = str(ObjectId())
        todos_residuos = [str(ObjectId()), str(ObjectId()), str(ObjectId())]
        residuos_coletados = todos_residuos[:2]  # Apenas os 2 primeiros
        
        mock_coleta = {
            "_id": coleta_id,
            "id": coleta_id,
            "agendamento_id": str(ObjectId()),
            "produtor_id": str(ObjectId()),
            "coletor_id": coletor_id,
            "residuos_id": todos_residuos,
            "data_hora": datetime.now(),
            "local": {"address_id": 1},
            "estado": EstadoColeta.EM_ANDAMENTO
        }
        
        mock_residuo_reservado = {
            "_id": "mock_id",
            "status": "RESERVADO"
        }
        
        mock_coletor_antes = {
            "_id": coletor_id,
            "name": "Coletor Teste",
            "email": "coletor@test.com",
            "role_id": "coletor",
            "inventory": []  # Inventory vazio antes de coletar
        }
        
        service = ColetaService()
        
        with patch('src.infra.database.repositories.coleta_repo.find_by_id',
                   new_callable=AsyncMock, return_value=mock_coleta), \
             patch('src.infra.database.repositories.residue_repo.find_by_id',
                   new_callable=AsyncMock, return_value=mock_residuo_reservado), \
             patch('src.infra.database.repositories.residue_repo.atualizar_status',
                   new_callable=AsyncMock), \
             patch('src.infra.database.repositories.user_repo.find_by_id',
                   new_callable=AsyncMock, return_value=mock_coletor_antes), \
             patch('src.infra.database.repositories.user_repo.update_user',
                   new_callable=AsyncMock, return_value=True) as mock_user_update, \
             patch.object(service, '_verificar_conclusao_agendamento',
                          new_callable=AsyncMock):
            
            # ACT
            await service.coletar_residuo(coleta_id, residuos_coletados, coletor_id)
            
            # ASSERT
            mock_user_update.assert_called_once()
            call_args = mock_user_update.call_args
            updated_coletor = call_args[0][1]
            
            assert "inventory" in updated_coletor, \
                "Coletor deve ter campo 'inventory' após coletar resíduos"
            
            assert set(updated_coletor["inventory"]) == set(residuos_coletados), \
                f"Inventory do coletor deve conter apenas os IDs dos resíduos coletados. " \
                f"Esperado: {residuos_coletados}, Recebido: {updated_coletor.get('inventory', [])}"

    @pytest.mark.asyncio
    async def test_coletar_residuo_adiciona_ao_inventory_existente(self):
        """
        Testa que ao coletar novos resíduos, eles são ADICIONADOS 
        ao inventory existente (não substituem os anteriores).
        
        Given: Um coletor com 2 resíduos já no inventory
        And: Uma coleta EM_ANDAMENTO com 3 resíduos diferentes
        When: O coletor coleta 2 dos 3 resíduos da coleta
        Then: O inventory deve conter 4 resíduos (2 antigos + 2 novos)
        """
        # ARRANGE
        coleta_id = str(ObjectId())
        coletor_id = str(ObjectId())
        
        residuos_antigos = [str(ObjectId()), str(ObjectId())]
        residuos_na_coleta = [str(ObjectId()), str(ObjectId()), str(ObjectId())]
        residuos_a_coletar = residuos_na_coleta[:2]
        
        mock_coleta = {
            "_id": coleta_id,
            "id": coleta_id,
            "agendamento_id": str(ObjectId()),
            "produtor_id": str(ObjectId()),
            "coletor_id": coletor_id,
            "residuos_id": residuos_na_coleta,
            "data_hora": datetime.now(),
            "local": {"address_id": 1},
            "estado": EstadoColeta.EM_ANDAMENTO
        }
        
        mock_residuo_reservado = {
            "_id": "mock_id",
            "status": "RESERVADO"
        }
        
        mock_coletor_antes = {
            "_id": coletor_id,
            "name": "Coletor Teste",
            "email": "coletor@test.com",
            "role_id": "coletor",
            "inventory": residuos_antigos.copy()
        }
        
        service = ColetaService()
        
        with patch('src.infra.database.repositories.coleta_repo.find_by_id',
                   new_callable=AsyncMock, return_value=mock_coleta), \
             patch('src.infra.database.repositories.residue_repo.find_by_id',
                   new_callable=AsyncMock, return_value=mock_residuo_reservado), \
             patch('src.infra.database.repositories.residue_repo.atualizar_status',
                   new_callable=AsyncMock), \
             patch('src.infra.database.repositories.user_repo.find_by_id',
                   new_callable=AsyncMock, return_value=mock_coletor_antes), \
             patch('src.infra.database.repositories.user_repo.update_user',
                   new_callable=AsyncMock, return_value=True) as mock_user_update, \
             patch.object(service, '_verificar_conclusao_agendamento',
                          new_callable=AsyncMock):
            
            # ACT
            await service.coletar_residuo(coleta_id, residuos_a_coletar, coletor_id)
            
            # ASSERT
            call_args = mock_user_update.call_args
            updated_coletor = call_args[0][1]
            
            todos_residuos = residuos_antigos + residuos_a_coletar
            
            assert len(updated_coletor["inventory"]) == 4, \
                f"Inventory deve ter 4 resíduos (2 antigos + 2 novos). " \
                f"Atual: {len(updated_coletor.get('inventory', []))}"
            
            assert set(updated_coletor["inventory"]) == set(todos_residuos), \
                "Inventory deve conter todos os resíduos (antigos + novos coletados)"

    @pytest.mark.asyncio
    async def test_cancelar_coleta_remove_residuos_do_inventory(self):
        """
        Testa que ao cancelar uma coleta EM_ANDAMENTO, 
        os resíduos são REMOVIDOS do inventory do coletor.
        
        Given: Uma coleta EM_ANDAMENTO com 2 resíduos
        And: Coletor tem 4 resíduos no inventory (2 desta coleta + 2 de outra)
        When: O coletor cancela a coleta após chegar ao local
        Then: Os 2 resíduos desta coleta devem ser removidos do inventory
        """
        # ARRANGE
        coleta_id = str(ObjectId())
        coletor_id = str(ObjectId())
        
        residuos_desta_coleta = [str(ObjectId()), str(ObjectId())]
        residuos_outras_coletas = [str(ObjectId()), str(ObjectId())]
        
        mock_coleta = {
            "_id": coleta_id,
            "id": coleta_id,
            "agendamento_id": str(ObjectId()),
            "produtor_id": str(ObjectId()),
            "coletor_id": coletor_id,
            "residuos_id": residuos_desta_coleta,
            "data_hora": datetime.now(),
            "local": {"address_id": 1},
            "estado": EstadoColeta.EM_ANDAMENTO
        }
        
        mock_coleta_atualizada = {
            **mock_coleta,
            "estado": EstadoColeta.CANCELADA
        }
        
        mock_coletor_antes = {
            "_id": coletor_id,
            "name": "Coletor Teste",
            "email": "coletor@test.com",
            "role_id": "coletor",
            "inventory": residuos_desta_coleta + residuos_outras_coletas
        }
        
        service = ColetaService()
        
        with patch('src.infra.database.repositories.coleta_repo.find_by_id') as mock_find, \
             patch('src.infra.database.repositories.user_repo.find_by_id',
                   new_callable=AsyncMock, return_value=mock_coletor_antes), \
             patch('src.infra.database.repositories.coleta_repo.update_estado',
                   new_callable=AsyncMock, return_value=True), \
             patch('src.infra.database.repositories.coleta_repo.append_observacao',
                   new_callable=AsyncMock, return_value=True), \
             patch('src.infra.database.repositories.residue_repo.find_by_id',
                   new_callable=AsyncMock, return_value=None), \
             patch('src.infra.database.repositories.user_repo.update_user',
                   new_callable=AsyncMock, return_value=True) as mock_user_update, \
             patch.object(service, '_verificar_conclusao_agendamento',
                          new_callable=AsyncMock):
            
            # Configurar mock para retornar coleta antes e depois da atualização
            mock_find.side_effect = AsyncMock(side_effect=[mock_coleta, mock_coleta_atualizada])
            
            # ACT
            await service.cancelar_apos_chegar_local(coleta_id, coletor_id, "Motivo do cancelamento")
            
            # ASSERT
            call_args = mock_user_update.call_args
            updated_coletor = call_args[0][1]
            
            assert len(updated_coletor["inventory"]) == 2, \
                f"Inventory deve ter 2 resíduos após cancelar coleta. " \
                f"Atual: {len(updated_coletor.get('inventory', []))}"
            
            assert set(updated_coletor["inventory"]) == set(residuos_outras_coletas), \
                "Inventory deve conter apenas os resíduos de outras coletas em andamento"

    @pytest.mark.asyncio
    async def test_get_inventory_retorna_residuos_detalhados(self):
        """
        Testa que ao obter o inventory, retorna dados COMPLETOS dos resíduos,
        não apenas IDs.
        
        Given: Um coletor com 3 resíduos no inventory
        When: Solicitar o inventory do coletor
        Then: Deve retornar lista com 3 objetos ResidueResponse completos
        """
        # ARRANGE
        coletor_id = str(ObjectId())
        residuos_ids = [str(ObjectId()), str(ObjectId()), str(ObjectId())]
        
        mock_coletor = {
            "_id": coletor_id,
            "name": "Coletor Teste",
            "email": "coletor@test.com",
            "role_id": "coletor",
            "inventory": residuos_ids
        }
        
        # Mock de resíduos completos
        mock_residuos = [
            {
                "_id": residuos_ids[0],
                "id": residuos_ids[0],
                "produtorId": str(ObjectId()),
                "categoriaId": str(ObjectId()),
                "quantidade": 10.0,
                "tipo_medida": "kg",
                "foto": "http://example.com/foto1.jpg",
                "valorEstimado": 15.0,
                "status": "COLETADO",
                "dataCadastro": datetime.now()
            },
            {
                "_id": residuos_ids[1],
                "id": residuos_ids[1],
                "produtorId": str(ObjectId()),
                "categoriaId": str(ObjectId()),
                "quantidade": 5.0,
                "tipo_medida": "unidade",
                "foto": "http://example.com/foto2.jpg",
                "valorEstimado": 7.5,
                "status": "COLETADO",
                "dataCadastro": datetime.now()
            },
            {
                "_id": residuos_ids[2],
                "id": residuos_ids[2],
                "produtorId": str(ObjectId()),
                "categoriaId": str(ObjectId()),
                "quantidade": 20.0,
                "tipo_medida": "kg",
                "foto": None,
                "valorEstimado": 30.0,
                "status": "COLETADO",
                "dataCadastro": datetime.now()
            }
        ]
        
        service = ColetaService()
        
        with patch('src.infra.database.repositories.user_repo.find_by_id',
                   new_callable=AsyncMock, return_value=mock_coletor), \
             patch('src.infra.database.repositories.residue_repo.find_by_id') as mock_residue_find:
            
            # Configurar mock para retornar resíduos diferentes por ID
            async def get_residuo_by_id(residuo_id):
                for r in mock_residuos:
                    if r["id"] == residuo_id:
                        return r
                return None
            
            mock_residue_find.side_effect = get_residuo_by_id
            
            # ACT
            inventory = await service.get_coletor_inventory(coletor_id)
            
            # ASSERT
            assert len(inventory) == 3, \
                f"Inventory deve retornar 3 resíduos. Recebido: {len(inventory)}"
            
            # Verificar que são objetos ResidueResponse, não apenas strings
            from src.schemas.residue_schema import ResidueResponse
            assert all(isinstance(r, ResidueResponse) for r in inventory), \
                "Todos os itens do inventory devem ser objetos ResidueResponse"
            
            # Verificar que têm os atributos esperados
            primeiro_residuo = inventory[0]
            assert hasattr(primeiro_residuo, 'quantidade'), \
                "ResidueResponse deve ter atributo 'quantidade'"
            assert hasattr(primeiro_residuo, 'valorEstimado'), \
                "ResidueResponse deve ter atributo 'valorEstimado'"
            assert hasattr(primeiro_residuo, 'categoriaId'), \
                "ResidueResponse deve ter atributo 'categoriaId'"
