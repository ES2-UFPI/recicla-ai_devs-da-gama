"""
Testes para o Service de Resgates
Testa a lógica de negócio do sistema de resgate de recompensas
"""
import pytest
from datetime import datetime
from bson import ObjectId
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException

from src.service.resgate_service import ResgateService
from src.schemas.resgate_schema import ResgateResponse


# ========== FIXTURES ==========

@pytest.fixture
def resgate_service():
    """Instância do service de resgates"""
    return ResgateService()


@pytest.fixture
def produtor_id():
    """ID de um produtor válido"""
    return str(ObjectId())


@pytest.fixture
def recompensa_id():
    """ID de uma recompensa válida"""
    return str(ObjectId())


@pytest.fixture
def recompensa_ativa_mock(recompensa_id):
    """Mock de recompensa ativa com estoque"""
    return {
        "_id": recompensa_id,
        "id": recompensa_id,
        "nome": "Vale-compra R$ 50,00",
        "tipo": "voucher",
        "pontos_necessarios": 500,
        "estoque": 100,
        "ativo": True
    }


@pytest.fixture
def recompensa_inativa_mock(recompensa_id):
    """Mock de recompensa inativa"""
    return {
        "_id": recompensa_id,
        "id": recompensa_id,
        "nome": "Produto Descontinuado",
        "tipo": "produto",
        "pontos_necessarios": 300,
        "estoque": 50,
        "ativo": False
    }


@pytest.fixture
def recompensa_sem_estoque_mock(recompensa_id):
    """Mock de recompensa ativa mas sem estoque"""
    return {
        "_id": recompensa_id,
        "id": recompensa_id,
        "nome": "Ecobag Esgotada",
        "tipo": "produto",
        "pontos_necessarios": 200,
        "estoque": 0,
        "ativo": True
    }


@pytest.fixture
def resgate_db_mock(recompensa_id, produtor_id):
    """Mock de resgate como retornado do banco"""
    return {
        "_id": str(ObjectId()),
        "id": str(ObjectId()),
        "recompensa_id": recompensa_id,
        "produtor_id": produtor_id,
        "pontos_gastos": 500,
        "data_resgate": datetime.utcnow()
    }


# ========== TESTES DE RESGATE - SUCESSO ==========

@pytest.mark.asyncio
async def test_resgatar_recompensa_sucesso(
    resgate_service,
    recompensa_id,
    produtor_id,
    recompensa_ativa_mock
):
    """
    DADO uma recompensa ativa com estoque e um produtor com pontos suficientes
    QUANDO resgatar_recompensa() é chamado
    ENTÃO deve debitar pontos, decrementar estoque e criar registro de resgate
    """
    with patch('src.service.resgate_service.recompensa_repo') as mock_recompensa_repo, \
         patch('src.service.resgate_service.user_repo') as mock_user_repo, \
         patch('src.service.resgate_service.criar_resgate') as mock_criar_resgate:
        
        # Configurar mocks
        mock_recompensa_repo.buscar_por_id = AsyncMock(return_value=recompensa_ativa_mock)
        mock_user_repo.obter_pontos = AsyncMock(return_value=1000)  # Produtor tem 1000 pontos
        mock_user_repo.atualizar_pontos = AsyncMock(return_value=True)
        mock_recompensa_repo.decrementar_estoque = AsyncMock(return_value=True)
        mock_criar_resgate.return_value = str(ObjectId())
        
        # Executar
        result = await resgate_service.resgatar_recompensa(recompensa_id, produtor_id)
        
        # Verificar
        assert isinstance(result, ResgateResponse)
        assert result.recompensa_id == recompensa_id
        assert result.produtor_id == produtor_id
        assert result.pontos_gastos == 500
        
        # Verificar chamadas
        mock_recompensa_repo.buscar_por_id.assert_called_once_with(recompensa_id)
        mock_user_repo.obter_pontos.assert_called_once_with(produtor_id)
        mock_user_repo.atualizar_pontos.assert_called_once_with(produtor_id, -500)
        mock_recompensa_repo.decrementar_estoque.assert_called_once_with(recompensa_id)
        mock_criar_resgate.assert_called_once()


# ========== TESTES DE RESGATE - VALIDAÇÕES ==========

@pytest.mark.asyncio
async def test_resgatar_recompensa_nao_encontrada(resgate_service, recompensa_id, produtor_id):
    """
    DADO uma recompensa que não existe
    QUANDO resgatar_recompensa() é chamado
    ENTÃO deve lançar HTTPException 404
    """
    with patch('src.service.resgate_service.recompensa_repo') as mock_repo:
        mock_repo.buscar_por_id = AsyncMock(return_value=None)
        
        # Executar e verificar
        with pytest.raises(HTTPException) as exc_info:
            await resgate_service.resgatar_recompensa(recompensa_id, produtor_id)
        
        assert exc_info.value.status_code == 404
        assert "não encontrada" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_resgatar_recompensa_inativa(
    resgate_service,
    recompensa_id,
    produtor_id,
    recompensa_inativa_mock
):
    """
    DADO uma recompensa inativa
    QUANDO resgatar_recompensa() é chamado
    ENTÃO deve lançar HTTPException 400
    """
    with patch('src.service.resgate_service.recompensa_repo') as mock_repo:
        mock_repo.buscar_por_id = AsyncMock(return_value=recompensa_inativa_mock)
        
        # Executar e verificar
        with pytest.raises(HTTPException) as exc_info:
            await resgate_service.resgatar_recompensa(recompensa_id, produtor_id)
        
        assert exc_info.value.status_code == 400
        assert "não está disponível" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_resgatar_recompensa_sem_estoque(
    resgate_service,
    recompensa_id,
    produtor_id,
    recompensa_sem_estoque_mock
):
    """
    DADO uma recompensa ativa mas sem estoque
    QUANDO resgatar_recompensa() é chamado
    ENTÃO deve lançar HTTPException 400
    """
    with patch('src.service.resgate_service.recompensa_repo') as mock_repo:
        mock_repo.buscar_por_id = AsyncMock(return_value=recompensa_sem_estoque_mock)
        
        # Executar e verificar
        with pytest.raises(HTTPException) as exc_info:
            await resgate_service.resgatar_recompensa(recompensa_id, produtor_id)
        
        assert exc_info.value.status_code == 400
        assert "sem estoque" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_resgatar_recompensa_produtor_nao_encontrado(
    resgate_service,
    recompensa_id,
    produtor_id,
    recompensa_ativa_mock
):
    """
    DADO um produtor que não existe
    QUANDO resgatar_recompensa() é chamado
    ENTÃO deve lançar HTTPException 404
    """
    with patch('src.service.resgate_service.recompensa_repo') as mock_recompensa_repo, \
         patch('src.service.resgate_service.user_repo') as mock_user_repo:
        
        mock_recompensa_repo.buscar_por_id = AsyncMock(return_value=recompensa_ativa_mock)
        mock_user_repo.obter_pontos = AsyncMock(return_value=None)  # Produtor não existe
        
        # Executar e verificar
        with pytest.raises(HTTPException) as exc_info:
            await resgate_service.resgatar_recompensa(recompensa_id, produtor_id)
        
        assert exc_info.value.status_code == 404
        assert "produtor não encontrado" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_resgatar_recompensa_pontos_insuficientes(
    resgate_service,
    recompensa_id,
    produtor_id,
    recompensa_ativa_mock
):
    """
    DADO um produtor com pontos insuficientes
    QUANDO resgatar_recompensa() é chamado
    ENTÃO deve lançar HTTPException 400 com mensagem informativa
    """
    with patch('src.service.resgate_service.recompensa_repo') as mock_recompensa_repo, \
         patch('src.service.resgate_service.user_repo') as mock_user_repo:
        
        mock_recompensa_repo.buscar_por_id = AsyncMock(return_value=recompensa_ativa_mock)
        mock_user_repo.obter_pontos = AsyncMock(return_value=100)  # Produtor tem apenas 100 pontos
        
        # Executar e verificar
        with pytest.raises(HTTPException) as exc_info:
            await resgate_service.resgatar_recompensa(recompensa_id, produtor_id)
        
        assert exc_info.value.status_code == 400
        assert "insuficientes" in exc_info.value.detail.lower()
        assert "100" in exc_info.value.detail  # Deve mostrar pontos atuais
        assert "500" in exc_info.value.detail  # Deve mostrar pontos necessários


# ========== TESTES DE ROLLBACK ==========

@pytest.mark.asyncio
async def test_resgatar_recompensa_rollback_quando_falha_estoque(
    resgate_service,
    recompensa_id,
    produtor_id,
    recompensa_ativa_mock
):
    """
    DADO uma falha ao decrementar estoque após debitar pontos
    QUANDO resgatar_recompensa() é chamado
    ENTÃO deve fazer rollback devolvendo os pontos ao produtor
    """
    with patch('src.service.resgate_service.recompensa_repo') as mock_recompensa_repo, \
         patch('src.service.resgate_service.user_repo') as mock_user_repo:
        
        # Configurar mocks
        mock_recompensa_repo.buscar_por_id = AsyncMock(return_value=recompensa_ativa_mock)
        mock_user_repo.obter_pontos = AsyncMock(return_value=1000)
        mock_user_repo.atualizar_pontos = AsyncMock(return_value=True)
        mock_recompensa_repo.decrementar_estoque = AsyncMock(return_value=False)  # Falha!
        
        # Executar e verificar
        with pytest.raises(HTTPException) as exc_info:
            await resgate_service.resgatar_recompensa(recompensa_id, produtor_id)
        
        assert exc_info.value.status_code == 500
        assert "estoque" in exc_info.value.detail.lower()
        
        # Verificar que houve rollback (2 chamadas: débito + rollback)
        assert mock_user_repo.atualizar_pontos.call_count == 2
        
        # Primeira chamada: débito de 500 pontos
        first_call = mock_user_repo.atualizar_pontos.call_args_list[0]
        assert first_call[0] == (produtor_id, -500)
        
        # Segunda chamada: rollback devolvendo 500 pontos
        second_call = mock_user_repo.atualizar_pontos.call_args_list[1]
        assert second_call[0] == (produtor_id, 500)


# ========== TESTES DE LISTAGEM ==========

@pytest.mark.asyncio
async def test_listar_meus_resgates(resgate_service, produtor_id, resgate_db_mock):
    """
    DADO um produtor com histórico de resgates
    QUANDO listar_meus_resgates() é chamado
    ENTÃO deve retornar lista de resgates ordenada por data
    """
    with patch('src.service.resgate_service.listar_por_produtor') as mock_listar:
        # Configurar mock
        mock_listar.return_value = [resgate_db_mock]
        
        # Executar
        result = await resgate_service.listar_meus_resgates(produtor_id)
        
        # Verificar
        assert len(result) == 1
        assert isinstance(result[0], ResgateResponse)
        assert result[0].produtor_id == produtor_id
        assert result[0].pontos_gastos == 500
        
        # Verificar chamada ao repositório
        mock_listar.assert_called_once_with(produtor_id, limit=100, skip=0)


@pytest.mark.asyncio
async def test_listar_meus_resgates_com_paginacao(resgate_service, produtor_id):
    """
    DADO parâmetros de paginação
    QUANDO listar_meus_resgates() é chamado
    ENTÃO deve respeitar limit e skip
    """
    with patch('src.service.resgate_service.listar_por_produtor') as mock_listar:
        mock_listar.return_value = []
        
        # Executar
        await resgate_service.listar_meus_resgates(produtor_id, skip=10, limit=5)
        
        # Verificar
        mock_listar.assert_called_once_with(produtor_id, limit=5, skip=10)


@pytest.mark.asyncio
async def test_listar_meus_resgates_respeita_max_limit(resgate_service, produtor_id):
    """
    DADO um limit maior que MAX_LIMIT
    QUANDO listar_meus_resgates() é chamado
    ENTÃO deve limitar ao MAX_LIMIT (100)
    """
    with patch('src.service.resgate_service.listar_por_produtor') as mock_listar:
        mock_listar.return_value = []
        
        # Executar com limit=200 (maior que MAX_LIMIT)
        await resgate_service.listar_meus_resgates(produtor_id, limit=200)
        
        # Verificar que foi limitado a 100
        mock_listar.assert_called_once_with(produtor_id, limit=100, skip=0)


@pytest.mark.asyncio
async def test_listar_meus_resgates_skip_negativo_vira_zero(resgate_service, produtor_id):
    """
    DADO um skip negativo
    QUANDO listar_meus_resgates() é chamado
    ENTÃO deve usar skip=0
    """
    with patch('src.service.resgate_service.listar_por_produtor') as mock_listar:
        mock_listar.return_value = []
        
        # Executar com skip=-5
        await resgate_service.listar_meus_resgates(produtor_id, skip=-5)
        
        # Verificar que skip foi corrigido para 0
        mock_listar.assert_called_once_with(produtor_id, limit=100, skip=0)
