"""
Testes para o Service de Recompensas
Testa a lógica de negócio do sistema de recompensas (CRUD básico)
"""
import pytest
from datetime import datetime
from bson import ObjectId
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import HTTPException

from src.service.recompensa_service import RecompensaService
from src.schemas.recompensa_schema import RecompensaCreate, RecompensaUpdate, RecompensaResponse


# ========== FIXTURES ==========

@pytest.fixture
def recompensa_service():
    """Instância do service de recompensas"""
    return RecompensaService()


@pytest.fixture
def recompensa_create_valida():
    """Dados válidos para criar uma recompensa"""
    return RecompensaCreate(
        nome="Vale-compra R$ 50,00",
        tipo="voucher",
        descricao="Vale-compra de R$ 50,00 para usar em lojas parceiras",
        pontos_necessarios=500,
        foto_url="https://example.com/vale50.jpg",
        estoque=100,
        parceiro="Supermercado Verde",
        ativo=True
    )


@pytest.fixture
def recompensa_db_mock():
    """Mock de recompensa como retornada do banco de dados"""
    return {
        "_id": str(ObjectId()),
        "id": str(ObjectId()),
        "nome": "Vale-compra R$ 50,00",
        "tipo": "voucher",
        "descricao": "Vale-compra de R$ 50,00 para usar em lojas parceiras",
        "pontos_necessarios": 500,
        "foto_url": "https://example.com/vale50.jpg",
        "estoque": 100,
        "parceiro": "Supermercado Verde",
        "data_cadastro": datetime.utcnow(),
        "ativo": True
    }


@pytest.fixture
def recompensa_db_inativa():
    """Mock de recompensa inativa"""
    return {
        "_id": str(ObjectId()),
        "id": str(ObjectId()),
        "nome": "Produto Descontinuado",
        "tipo": "produto",
        "descricao": "Produto que não está mais disponível",
        "pontos_necessarios": 300,
        "estoque": 0,
        "data_cadastro": datetime.utcnow(),
        "ativo": False
    }


# ========== TESTES DE LISTAGEM ==========

@pytest.mark.asyncio
async def test_listar_recompensas_ativas(recompensa_service, recompensa_db_mock):
    """
    Testa listagem de recompensas ativas.
    
    Given: Recompensas ativas no banco
    When: Listar recompensas ativas
    Then: Deve retornar apenas recompensas ativas
    """
    # Arrange
    mock_recompensas = [recompensa_db_mock]
    
    with patch('src.service.recompensa_service.recompensa_repo') as mock_repo:
        mock_repo.listar_recompensas_ativas = AsyncMock(return_value=mock_recompensas)
        
        # Act
        result = await recompensa_service.listar_recompensas_ativas()
        
        # Assert
        assert len(result) == 1
        assert result[0].nome == "Vale-compra R$ 50,00"
        assert result[0].ativo is True
        mock_repo.listar_recompensas_ativas.assert_called_once_with(
            com_estoque=False,
            skip=0,
            limit=100
        )


@pytest.mark.asyncio
async def test_listar_recompensas_ativas_com_estoque(recompensa_service, recompensa_db_mock):
    """
    Testa listagem de recompensas ativas com estoque.
    
    Given: Recompensas ativas com estoque
    When: Listar com filtro com_estoque=True
    Then: Deve retornar apenas recompensas com estoque > 0
    """
    # Arrange
    mock_recompensas = [recompensa_db_mock]
    
    with patch('src.service.recompensa_service.recompensa_repo') as mock_repo:
        mock_repo.listar_recompensas_ativas = AsyncMock(return_value=mock_recompensas)
        
        # Act
        result = await recompensa_service.listar_recompensas_ativas(com_estoque=True)
        
        # Assert
        assert len(result) == 1
        assert result[0].estoque > 0
        mock_repo.listar_recompensas_ativas.assert_called_once_with(
            com_estoque=True,
            skip=0,
            limit=100
        )


@pytest.mark.asyncio
async def test_listar_recompensas_ativas_vazia(recompensa_service):
    """
    Testa listagem quando não há recompensas ativas.
    
    Given: Nenhuma recompensa ativa no banco
    When: Listar recompensas ativas
    Then: Deve retornar lista vazia
    """
    # Arrange
    with patch('src.service.recompensa_service.recompensa_repo') as mock_repo:
        mock_repo.listar_recompensas_ativas = AsyncMock(return_value=[])
        
        # Act
        result = await recompensa_service.listar_recompensas_ativas()
        
        # Assert
        assert len(result) == 0
        assert isinstance(result, list)


@pytest.mark.asyncio
async def test_listar_recompensas_ativas_com_paginacao(recompensa_service, recompensa_db_mock):
    """
    Testa paginação na listagem de recompensas.
    
    Given: Múltiplas recompensas ativas
    When: Listar com skip e limit
    Then: Deve passar parâmetros de paginação corretamente
    """
    # Arrange
    mock_recompensas = [recompensa_db_mock]
    
    with patch('src.service.recompensa_service.recompensa_repo') as mock_repo:
        mock_repo.listar_recompensas_ativas = AsyncMock(return_value=mock_recompensas)
        
        # Act
        result = await recompensa_service.listar_recompensas_ativas(skip=10, limit=5)
        
        # Assert
        mock_repo.listar_recompensas_ativas.assert_called_once_with(
            com_estoque=False,
            skip=10,
            limit=5
        )


@pytest.mark.asyncio
async def test_listar_todas_recompensas(recompensa_service, recompensa_db_mock, recompensa_db_inativa):
    """
    Testa listagem de todas as recompensas (ativas e inativas).
    
    Given: Recompensas ativas e inativas no banco
    When: Listar todas as recompensas
    Then: Deve retornar todas sem filtrar por status
    """
    # Arrange
    mock_recompensas = [recompensa_db_mock, recompensa_db_inativa]
    
    with patch('src.service.recompensa_service.recompensa_repo') as mock_repo:
        mock_repo.listar_todas_recompensas = AsyncMock(return_value=mock_recompensas)
        
        # Act
        result = await recompensa_service.listar_todas_recompensas()
        
        # Assert
        assert len(result) == 2
        assert any(r.ativo for r in result)  # Pelo menos uma ativa
        assert any(not r.ativo for r in result)  # Pelo menos uma inativa
        mock_repo.listar_todas_recompensas.assert_called_once_with(skip=0, limit=100)


# ========== TESTES DE OBTER RECOMPENSA ==========

@pytest.mark.asyncio
async def test_obter_recompensa_existente(recompensa_service, recompensa_db_mock):
    """
    Testa obtenção de recompensa existente.
    
    Given: Recompensa existente no banco
    When: Obter recompensa por ID
    Then: Deve retornar a recompensa com dados corretos
    """
    # Arrange
    recompensa_id = recompensa_db_mock["id"]
    
    with patch('src.service.recompensa_service.recompensa_repo') as mock_repo:
        mock_repo.buscar_por_id = AsyncMock(return_value=recompensa_db_mock)
        
        # Act
        result = await recompensa_service.obter_recompensa(recompensa_id)
        
        # Assert
        assert result.nome == "Vale-compra R$ 50,00"
        assert result.tipo == "voucher"
        assert result.pontos_necessarios == 500
        mock_repo.buscar_por_id.assert_called_once_with(recompensa_id)


@pytest.mark.asyncio
async def test_obter_recompensa_inexistente(recompensa_service):
    """
    Testa obtenção de recompensa que não existe.
    
    Given: ID de recompensa inexistente
    When: Tentar obter recompensa
    Then: Deve lançar HTTPException 404
    """
    # Arrange
    recompensa_id = str(ObjectId())
    
    with patch('src.service.recompensa_service.recompensa_repo') as mock_repo:
        mock_repo.buscar_por_id = AsyncMock(return_value=None)
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await recompensa_service.obter_recompensa(recompensa_id)
        
        assert exc_info.value.status_code == 404
        assert "não encontrada" in str(exc_info.value.detail)


# ========== TESTES DE CRIAR RECOMPENSA ==========

@pytest.mark.asyncio
async def test_criar_recompensa_sucesso(recompensa_service, recompensa_create_valida, recompensa_db_mock):
    """
    Testa criação de recompensa com sucesso.
    
    Given: Dados válidos de recompensa
    When: Criar nova recompensa
    Then: Deve criar e retornar a recompensa
    """
    # Arrange
    novo_id = recompensa_db_mock["id"]
    
    with patch('src.service.recompensa_service.recompensa_repo') as mock_repo:
        mock_repo.criar_recompensa = AsyncMock(return_value=novo_id)
        mock_repo.buscar_por_id = AsyncMock(return_value=recompensa_db_mock)
        
        # Act
        result = await recompensa_service.criar_recompensa(recompensa_create_valida)
        
        # Assert
        assert result.nome == "Vale-compra R$ 50,00"
        assert result.tipo == "voucher"
        assert result.pontos_necessarios == 500
        mock_repo.criar_recompensa.assert_called_once()
        mock_repo.buscar_por_id.assert_called_once_with(novo_id)


@pytest.mark.asyncio
async def test_criar_recompensa_erro_recuperacao(recompensa_service, recompensa_create_valida):
    """
    Testa erro ao recuperar recompensa recém-criada.
    
    Given: Recompensa criada com sucesso
    When: Falha ao recuperar recompensa criada
    Then: Deve lançar HTTPException 500
    """
    # Arrange
    novo_id = str(ObjectId())
    
    with patch('src.service.recompensa_service.recompensa_repo') as mock_repo:
        mock_repo.criar_recompensa = AsyncMock(return_value=novo_id)
        mock_repo.buscar_por_id = AsyncMock(return_value=None)  # Falha ao recuperar
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await recompensa_service.criar_recompensa(recompensa_create_valida)
        
        assert exc_info.value.status_code == 500
        assert "Erro ao recuperar" in str(exc_info.value.detail)


# ========== TESTES DE ATUALIZAR RECOMPENSA ==========

@pytest.mark.asyncio
async def test_atualizar_recompensa_sucesso(recompensa_service, recompensa_db_mock):
    """
    Testa atualização de recompensa com sucesso.
    
    Given: Recompensa existente
    When: Atualizar campos da recompensa
    Then: Deve atualizar e retornar a recompensa atualizada
    """
    # Arrange
    recompensa_id = recompensa_db_mock["id"]
    updates = RecompensaUpdate(estoque=75, ativo=True)
    
    recompensa_atualizada = {**recompensa_db_mock, "estoque": 75}
    
    with patch('src.service.recompensa_service.recompensa_repo') as mock_repo:
        mock_repo.buscar_por_id = AsyncMock(side_effect=[
            recompensa_db_mock,  # Primeira chamada (verificação)
            recompensa_atualizada  # Segunda chamada (retorno)
        ])
        mock_repo.atualizar_recompensa = AsyncMock(return_value=True)
        
        # Act
        result = await recompensa_service.atualizar_recompensa(recompensa_id, updates)
        
        # Assert
        assert result.estoque == 75
        mock_repo.atualizar_recompensa.assert_called_once()


@pytest.mark.asyncio
async def test_atualizar_recompensa_inexistente(recompensa_service):
    """
    Testa atualização de recompensa inexistente.
    
    Given: ID de recompensa inexistente
    When: Tentar atualizar
    Then: Deve lançar HTTPException 404
    """
    # Arrange
    recompensa_id = str(ObjectId())
    updates = RecompensaUpdate(estoque=50)
    
    with patch('src.service.recompensa_service.recompensa_repo') as mock_repo:
        mock_repo.buscar_por_id = AsyncMock(return_value=None)
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await recompensa_service.atualizar_recompensa(recompensa_id, updates)
        
        assert exc_info.value.status_code == 404
        assert "não encontrada" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_atualizar_recompensa_sem_updates(recompensa_service, recompensa_db_mock):
    """
    Testa atualização sem fornecer campos para atualizar.
    
    Given: Recompensa existente
    When: Chamar atualização sem nenhum campo
    Then: Deve retornar a recompensa sem modificações
    """
    # Arrange
    recompensa_id = recompensa_db_mock["id"]
    updates = RecompensaUpdate()  # Nenhum campo
    
    with patch('src.service.recompensa_service.recompensa_repo') as mock_repo:
        mock_repo.buscar_por_id = AsyncMock(return_value=recompensa_db_mock)
        
        # Act
        result = await recompensa_service.atualizar_recompensa(recompensa_id, updates)
        
        # Assert
        assert result.nome == recompensa_db_mock["nome"]
        # Não deve ter chamado atualizar_recompensa
        mock_repo.atualizar_recompensa.assert_not_called()


@pytest.mark.asyncio
async def test_atualizar_recompensa_erro_persistencia(recompensa_service, recompensa_db_mock):
    """
    Testa erro ao persistir atualização.
    
    Given: Recompensa existente
    When: Erro ao atualizar no banco
    Then: Deve lançar HTTPException 500
    """
    # Arrange
    recompensa_id = recompensa_db_mock["id"]
    updates = RecompensaUpdate(estoque=75)
    
    with patch('src.service.recompensa_service.recompensa_repo') as mock_repo:
        mock_repo.buscar_por_id = AsyncMock(return_value=recompensa_db_mock)
        mock_repo.atualizar_recompensa = AsyncMock(return_value=False)  # Falha
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await recompensa_service.atualizar_recompensa(recompensa_id, updates)
        
        assert exc_info.value.status_code == 500
        assert "Erro ao atualizar" in str(exc_info.value.detail)


# ========== TESTES DE ATUALIZAR ESTOQUE ==========

@pytest.mark.asyncio
async def test_atualizar_estoque_incrementar(recompensa_service, recompensa_db_mock):
    """
    Testa incremento de estoque.
    
    Given: Recompensa existente
    When: Adicionar 50 unidades ao estoque
    Then: Deve incrementar o estoque
    """
    # Arrange
    recompensa_id = recompensa_db_mock["id"]
    quantidade = 50
    
    recompensa_atualizada = {**recompensa_db_mock, "estoque": 150}
    
    with patch('src.service.recompensa_service.recompensa_repo') as mock_repo:
        mock_repo.buscar_por_id = AsyncMock(side_effect=[
            recompensa_db_mock,
            recompensa_atualizada
        ])
        mock_repo.atualizar_estoque = AsyncMock(return_value=True)
        
        # Act
        result = await recompensa_service.atualizar_estoque(recompensa_id, quantidade)
        
        # Assert
        assert result.estoque == 150
        mock_repo.atualizar_estoque.assert_called_once_with(recompensa_id, quantidade)


@pytest.mark.asyncio
async def test_atualizar_estoque_decrementar(recompensa_service, recompensa_db_mock):
    """
    Testa decremento de estoque.
    
    Given: Recompensa com estoque 100
    When: Remover 30 unidades
    Then: Deve decrementar o estoque
    """
    # Arrange
    recompensa_id = recompensa_db_mock["id"]
    quantidade = -30
    
    recompensa_atualizada = {**recompensa_db_mock, "estoque": 70}
    
    with patch('src.service.recompensa_service.recompensa_repo') as mock_repo:
        mock_repo.buscar_por_id = AsyncMock(side_effect=[
            recompensa_db_mock,
            recompensa_atualizada
        ])
        mock_repo.atualizar_estoque = AsyncMock(return_value=True)
        
        # Act
        result = await recompensa_service.atualizar_estoque(recompensa_id, quantidade)
        
        # Assert
        assert result.estoque == 70
        mock_repo.atualizar_estoque.assert_called_once_with(recompensa_id, quantidade)


@pytest.mark.asyncio
async def test_atualizar_estoque_recompensa_inexistente(recompensa_service):
    """
    Testa atualização de estoque de recompensa inexistente.
    
    Given: ID de recompensa inexistente
    When: Tentar atualizar estoque
    Then: Deve lançar HTTPException 404
    """
    # Arrange
    recompensa_id = str(ObjectId())
    quantidade = 10
    
    with patch('src.service.recompensa_service.recompensa_repo') as mock_repo:
        mock_repo.buscar_por_id = AsyncMock(return_value=None)
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await recompensa_service.atualizar_estoque(recompensa_id, quantidade)
        
        assert exc_info.value.status_code == 404


# ========== TESTES DE DESATIVAR RECOMPENSA ==========

@pytest.mark.asyncio
async def test_desativar_recompensa_sucesso(recompensa_service, recompensa_db_mock):
    """
    Testa desativação de recompensa (soft delete).
    
    Given: Recompensa ativa
    When: Desativar recompensa
    Then: Deve marcar como inativa
    """
    # Arrange
    recompensa_id = recompensa_db_mock["id"]
    recompensa_desativada = {**recompensa_db_mock, "ativo": False}
    
    with patch('src.service.recompensa_service.recompensa_repo') as mock_repo:
        mock_repo.buscar_por_id = AsyncMock(side_effect=[
            recompensa_db_mock,
            recompensa_desativada
        ])
        mock_repo.desativar_recompensa = AsyncMock(return_value=True)
        
        # Act
        result = await recompensa_service.desativar_recompensa(recompensa_id)
        
        # Assert
        assert result.ativo is False
        mock_repo.desativar_recompensa.assert_called_once_with(recompensa_id)


@pytest.mark.asyncio
async def test_desativar_recompensa_inexistente(recompensa_service):
    """
    Testa desativação de recompensa inexistente.
    
    Given: ID de recompensa inexistente
    When: Tentar desativar
    Then: Deve lançar HTTPException 404
    """
    # Arrange
    recompensa_id = str(ObjectId())
    
    with patch('src.service.recompensa_service.recompensa_repo') as mock_repo:
        mock_repo.buscar_por_id = AsyncMock(return_value=None)
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await recompensa_service.desativar_recompensa(recompensa_id)
        
        assert exc_info.value.status_code == 404


# ========== TESTES DE REATIVAR RECOMPENSA ==========

@pytest.mark.asyncio
async def test_reativar_recompensa_sucesso(recompensa_service, recompensa_db_inativa):
    """
    Testa reativação de recompensa inativa.
    
    Given: Recompensa inativa
    When: Reativar recompensa
    Then: Deve marcar como ativa
    """
    # Arrange
    recompensa_id = recompensa_db_inativa["id"]
    recompensa_ativada = {**recompensa_db_inativa, "ativo": True}
    
    with patch('src.service.recompensa_service.recompensa_repo') as mock_repo:
        mock_repo.buscar_por_id = AsyncMock(side_effect=[
            recompensa_db_inativa,
            recompensa_ativada
        ])
        mock_repo.ativar_recompensa = AsyncMock(return_value=True)
        
        # Act
        result = await recompensa_service.reativar_recompensa(recompensa_id)
        
        # Assert
        assert result.ativo is True
        mock_repo.ativar_recompensa.assert_called_once_with(recompensa_id)


@pytest.mark.asyncio
async def test_reativar_recompensa_inexistente(recompensa_service):
    """
    Testa reativação de recompensa inexistente.
    
    Given: ID de recompensa inexistente
    When: Tentar reativar
    Then: Deve lançar HTTPException 404
    """
    # Arrange
    recompensa_id = str(ObjectId())
    
    with patch('src.service.recompensa_service.recompensa_repo') as mock_repo:
        mock_repo.buscar_por_id = AsyncMock(return_value=None)
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await recompensa_service.reativar_recompensa(recompensa_id)
        
        assert exc_info.value.status_code == 404
