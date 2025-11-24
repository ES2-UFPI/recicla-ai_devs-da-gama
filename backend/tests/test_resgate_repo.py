"""
Testes para o Repository de Resgates
Testa operações de acesso a dados para histórico de resgates de recompensas
"""
import pytest
from datetime import datetime
from bson import ObjectId
from unittest.mock import AsyncMock, patch, MagicMock

from src.infra.database.repositories.resgate_repo import criar_resgate, listar_por_produtor
from src.infra.database.models.resgate_recompensa import ResgateRecompensa


# ========== FIXTURES ==========

@pytest.fixture
def resgate_doc_valido():
    """Documento válido para criar um resgate"""
    return ResgateRecompensa(
        recompensa_id=str(ObjectId()),
        produtor_id=str(ObjectId()),
        pontos_gastos=500,
        data_resgate=datetime.utcnow()
    )


@pytest.fixture
def resgate_db_mock():
    """Mock de resgate como retornado do banco de dados"""
    recompensa_id = str(ObjectId())
    produtor_id = str(ObjectId())
    return {
        "_id": ObjectId(),
        "recompensa_id": recompensa_id,
        "produtor_id": produtor_id,
        "pontos_gastos": 500,
        "data_resgate": datetime.utcnow()
    }


# ========== TESTES - CRIAR RESGATE ==========

@pytest.mark.asyncio
async def test_criar_resgate(resgate_doc_valido):
    """
    DADO um documento válido de resgate
    QUANDO criar_resgate() é chamado
    ENTÃO deve inserir o documento no banco e retornar o ID gerado
    """
    mock_inserted_id = ObjectId()
    
    with patch("src.infra.database.repositories.resgate_repo.get_database") as mock_db:
        # Configurar mock do banco
        mock_collection = AsyncMock()
        mock_collection.insert_one = AsyncMock(return_value=MagicMock(inserted_id=mock_inserted_id))
        mock_db.return_value.__getitem__.return_value = mock_collection
        
        # Converter Pydantic model para dict
        resgate_dict = resgate_doc_valido.model_dump(by_alias=True, exclude_unset=True)
        
        # Executar
        result = await criar_resgate(resgate_dict)
        
        # Verificar
        assert result == str(mock_inserted_id)
        mock_collection.insert_one.assert_called_once()
        
        # Validar estrutura do documento inserido
        call_args = mock_collection.insert_one.call_args[0][0]
        assert call_args["recompensa_id"] == resgate_doc_valido.recompensa_id
        assert call_args["produtor_id"] == resgate_doc_valido.produtor_id
        assert call_args["pontos_gastos"] == resgate_doc_valido.pontos_gastos
        assert "data_resgate" in call_args


# ========== TESTES - LISTAR RESGATES POR PRODUTOR ==========

@pytest.mark.asyncio
async def test_listar_por_produtor(resgate_db_mock):
    """
    DADO um produtor_id válido
    QUANDO listar_por_produtor() é chamado
    ENTÃO deve retornar lista de resgates ordenada por data decrescente
    """
    produtor_id = str(ObjectId())
    
    # Criar 3 resgates mock com datas diferentes
    resgate1 = {**resgate_db_mock, "_id": ObjectId(), "data_resgate": datetime(2024, 1, 1)}
    resgate2 = {**resgate_db_mock, "_id": ObjectId(), "data_resgate": datetime(2024, 1, 15)}
    resgate3 = {**resgate_db_mock, "_id": ObjectId(), "data_resgate": datetime(2024, 1, 30)}
    
    # Mock do cursor com todos os métodos encadeados
    mock_cursor = MagicMock()
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_cursor.skip = MagicMock(return_value=mock_cursor)
    mock_cursor.limit = MagicMock(return_value=mock_cursor)
    mock_cursor.to_list = AsyncMock(return_value=[resgate3, resgate2, resgate1])  # Ordem DESC
    
    with patch("src.infra.database.repositories.resgate_repo.get_database") as mock_db:
        # Configurar mock do banco
        mock_collection = MagicMock()
        mock_collection.find = MagicMock(return_value=mock_cursor)
        mock_db.return_value.__getitem__.return_value = mock_collection
        
        # Executar
        result = await listar_por_produtor(produtor_id, limit=10, skip=0)
        
        # Verificar
        assert len(result) == 3
        
        # Verificar ordenação DESC (mais recente primeiro)
        assert result[0]["data_resgate"] == datetime(2024, 1, 30)
        assert result[1]["data_resgate"] == datetime(2024, 1, 15)
        assert result[2]["data_resgate"] == datetime(2024, 1, 1)
        
        # Verificar que find foi chamado com filtro correto
        mock_collection.find.assert_called_once()
        call_args = mock_collection.find.call_args[0][0]
        assert call_args["produtor_id"] == produtor_id
        
        # Verificar paginação e ordenação
        mock_cursor.skip.assert_called_once_with(0)
        mock_cursor.limit.assert_called_once_with(10)
        mock_cursor.sort.assert_called_once_with("data_resgate", -1)
