"""
Testes TDD para funcionalidade de Inventário do Coletor

Issue: Implementar inventory do coletor
Descrição: O coletor possui um atributo 'inventory' que guarda os IDs de 
todos os resíduos que ele tem em coletas que estão EM_ANDAMENTO.

Regras de Negócio:
- inventory é uma lista de strings (IDs de resíduos)
- Deve conter todos os residuos_id de coletas com estado EM_ANDAMENTO
- Quando uma coleta é iniciada (PENDENTE -> EM_ANDAMENTO), os resíduos 
  devem ser adicionados ao inventory
- Quando uma coleta é concluída ou cancelada, os resíduos devem ser 
  removidos do inventory
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
    
    Valida que o inventory é atualizado corretamente ao iniciar, 
    concluir e cancelar coletas.
    """

    @pytest.mark.asyncio
    async def test_iniciar_coleta_adiciona_residuos_ao_inventory(self):
        """
        Testa que ao iniciar uma coleta (PENDENTE -> EM_ANDAMENTO), 
        os resíduos são adicionados ao inventory do coletor.
        
        Given: Uma coleta PENDENTE com 3 resíduos e coletor com inventory vazio
        When: O coletor inicia a coleta
        Then: Os 3 IDs de resíduos devem ser adicionados ao inventory do coletor
        """
        # ARRANGE
        coleta_id = str(ObjectId())
        coletor_id = str(ObjectId())
        residuos_ids = [str(ObjectId()), str(ObjectId()), str(ObjectId())]
        
        mock_coleta = {
            "_id": coleta_id,
            "id": coleta_id,
            "agendamento_id": str(ObjectId()),
            "produtor_id": str(ObjectId()),
            "coletor_id": coletor_id,
            "residuos_id": residuos_ids,
            "data_hora": datetime.now(),
            "local": {"address_id": 1},
            "estado": EstadoColeta.PENDENTE
        }
        
        mock_coleta_atualizada = {
            **mock_coleta,
            "estado": EstadoColeta.EM_ANDAMENTO
        }
        
        mock_coletor_antes = {
            "_id": coletor_id,
            "name": "Coletor Teste",
            "email": "coletor@test.com",
            "role_id": "coletor",
            "inventory": []  # Inventory vazio antes de iniciar coleta
        }
        
        service = ColetaService()
        
        with patch('src.infra.database.repositories.coleta_repo.find_by_id') as mock_find, \
             patch('src.infra.database.repositories.user_repo.find_by_id',
                   new_callable=AsyncMock, return_value=mock_coletor_antes) as mock_user_find, \
             patch('src.infra.database.repositories.coleta_repo.update_coleta',
                   new_callable=AsyncMock, return_value=True), \
             patch('src.infra.database.repositories.user_repo.update_user',
                   new_callable=AsyncMock, return_value=True) as mock_user_update:
            
            # Configurar mock para retornar coleta antes e depois da atualização
            mock_find.side_effect = AsyncMock(side_effect=[mock_coleta, mock_coleta_atualizada])
            
            # ACT
            await service.iniciar_coleta(coleta_id, coletor_id)
            
            # ASSERT
            # Verifica se o inventory do coletor foi atualizado
            mock_user_update.assert_called_once()
            call_args = mock_user_update.call_args
            
            # Pega o documento atualizado do coletor
            updated_coletor = call_args[0][1]  # segundo argumento (documento)
            
            assert "inventory" in updated_coletor, \
                "Coletor deve ter campo 'inventory' após iniciar coleta"
            
            assert set(updated_coletor["inventory"]) == set(residuos_ids), \
                f"Inventory do coletor deve conter os IDs dos resíduos da coleta. " \
                f"Esperado: {residuos_ids}, Recebido: {updated_coletor.get('inventory', [])}"

    @pytest.mark.asyncio
    async def test_iniciar_coleta_adiciona_residuos_ao_inventory_existente(self):
        """
        Testa que ao iniciar uma nova coleta, os resíduos são ADICIONADOS 
        ao inventory existente (não substituem os anteriores).
        
        Given: Um coletor com 2 resíduos já no inventory
        And: Uma nova coleta PENDENTE com 3 resíduos diferentes
        When: O coletor inicia a nova coleta
        Then: O inventory deve conter 5 resíduos (2 antigos + 3 novos)
        """
        # ARRANGE
        coleta_id = str(ObjectId())
        coletor_id = str(ObjectId())
        
        residuos_antigos = [str(ObjectId()), str(ObjectId())]
        residuos_novos = [str(ObjectId()), str(ObjectId()), str(ObjectId())]
        
        mock_coleta = {
            "_id": coleta_id,
            "id": coleta_id,
            "agendamento_id": str(ObjectId()),
            "produtor_id": str(ObjectId()),
            "coletor_id": coletor_id,
            "residuos_id": residuos_novos,
            "data_hora": datetime.now(),
            "local": {"address_id": 1},
            "estado": EstadoColeta.PENDENTE
        }
        
        mock_coleta_atualizada = {
            **mock_coleta,
            "estado": EstadoColeta.EM_ANDAMENTO
        }
        
        mock_coletor_antes = {
            "_id": coletor_id,
            "name": "Coletor Teste",
            "email": "coletor@test.com",
            "role_id": "coletor",
            "inventory": residuos_antigos.copy()  # Já tem resíduos no inventory
        }
        
        service = ColetaService()
        
        with patch('src.infra.database.repositories.coleta_repo.find_by_id') as mock_find, \
             patch('src.infra.database.repositories.user_repo.find_by_id',
                   new_callable=AsyncMock, return_value=mock_coletor_antes), \
             patch('src.infra.database.repositories.coleta_repo.update_coleta',
                   new_callable=AsyncMock, return_value=True), \
             patch('src.infra.database.repositories.user_repo.update_user',
                   new_callable=AsyncMock, return_value=True) as mock_user_update:
            
            # Configurar mock para retornar coleta antes e depois da atualização
            mock_find.side_effect = AsyncMock(side_effect=[mock_coleta, mock_coleta_atualizada])
            
            # ACT
            await service.iniciar_coleta(coleta_id, coletor_id)
            
            # ASSERT
            call_args = mock_user_update.call_args
            updated_coletor = call_args[0][1]
            
            todos_residuos = residuos_antigos + residuos_novos
            
            assert len(updated_coletor["inventory"]) == 5, \
                f"Inventory deve ter 5 resíduos (2 antigos + 3 novos). " \
                f"Atual: {len(updated_coletor.get('inventory', []))}"
            
            assert set(updated_coletor["inventory"]) == set(todos_residuos), \
                "Inventory deve conter todos os resíduos (antigos + novos)"

    @pytest.mark.asyncio
    async def test_concluir_coleta_remove_residuos_do_inventory(self):
        """
        Testa que ao concluir uma coleta (EM_ANDAMENTO -> CONCLUIDA), 
        os resíduos são REMOVIDOS do inventory do coletor.
        
        Given: Uma coleta EM_ANDAMENTO com 3 resíduos
        And: Coletor tem 5 resíduos no inventory (3 desta coleta + 2 de outra)
        When: O coletor conclui a coleta
        Then: Os 3 resíduos desta coleta devem ser removidos do inventory
        And: Os 2 resíduos de outras coletas devem permanecer
        """
        # ARRANGE
        coleta_id = str(ObjectId())
        coletor_id = str(ObjectId())
        
        residuos_desta_coleta = [str(ObjectId()), str(ObjectId()), str(ObjectId())]
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
            "estado": EstadoColeta.CONCLUIDA
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
             patch('src.infra.database.repositories.coleta_repo.update_coleta',
                   new_callable=AsyncMock, return_value=True), \
             patch('src.infra.database.repositories.user_repo.update_user',
                   new_callable=AsyncMock, return_value=True) as mock_user_update, \
             patch.object(service, '_verificar_conclusao_agendamento',
                          new_callable=AsyncMock):
            
            # Configurar mock para retornar coleta antes e depois da atualização
            mock_find.side_effect = AsyncMock(side_effect=[mock_coleta, mock_coleta_atualizada])
            
            # ACT
            await service.concluir_coleta(coleta_id, coletor_id)
            
            # ASSERT
            call_args = mock_user_update.call_args
            updated_coletor = call_args[0][1]
            
            assert len(updated_coletor["inventory"]) == 2, \
                f"Inventory deve ter 2 resíduos após concluir coleta. " \
                f"Atual: {len(updated_coletor.get('inventory', []))}"
            
            assert set(updated_coletor["inventory"]) == set(residuos_outras_coletas), \
                "Inventory deve conter apenas os resíduos de outras coletas em andamento"

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
    async def test_get_inventory_retorna_residuos_em_andamento(self):
        """
        Testa que existe um método para obter o inventory atual do coletor.
        
        Given: Um coletor com 3 resíduos no inventory
        When: Solicitar o inventory do coletor
        Then: Deve retornar a lista com os 3 IDs de resíduos
        """
        # ARRANGE
        coletor_id = str(ObjectId())
        residuos_inventory = [str(ObjectId()), str(ObjectId()), str(ObjectId())]
        
        mock_coletor = {
            "_id": coletor_id,
            "name": "Coletor Teste",
            "email": "coletor@test.com",
            "role_id": "coletor",
            "inventory": residuos_inventory
        }
        
        service = ColetaService()
        
        with patch('src.infra.database.repositories.user_repo.find_by_id',
                   new_callable=AsyncMock, return_value=mock_coletor):
            
            # ACT
            inventory = await service.get_coletor_inventory(coletor_id)
            
            # ASSERT
            assert inventory == residuos_inventory, \
                f"Inventory retornado deve corresponder ao esperado. " \
                f"Esperado: {residuos_inventory}, Recebido: {inventory}"
