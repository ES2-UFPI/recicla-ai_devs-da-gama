"""
Testes para o sistema de Recompensas
Testa operações do repositório e validações do modelo de recompensas
"""
import pytest
from datetime import datetime
from bson import ObjectId
from unittest.mock import AsyncMock, patch, MagicMock

from src.infra.database.models.recompensa import Recompensa
from src.schemas.recompensa_schema import RecompensaCreate, RecompensaUpdate
from src.infra.database.repositories import recompensa_repo


# ========== FIXTURES ==========

@pytest.fixture
def recompensa_valida():
    """Dados válidos para criar uma recompensa"""
    return {
        "nome": "Vale-compra R$ 50,00",
        "tipo": "voucher",
        "descricao": "Vale-compra de R$ 50,00 para usar em lojas parceiras",
        "pontos_necessarios": 500,
        "foto_url": "https://example.com/vale50.jpg",
        "estoque": 100,
        "parceiro": "Supermercado Verde",
        "ativo": True
    }


@pytest.fixture
def recompensa_produto():
    """Dados para criar uma recompensa tipo produto"""
    return {
        "nome": "Ecobag Reutilizável",
        "tipo": "produto",
        "descricao": "Ecobag de algodão orgânico para suas compras sustentáveis",
        "pontos_necessarios": 200,
        "foto_url": "https://example.com/ecobag.jpg",
        "estoque": 50,
        "parceiro": "EcoStore",
        "ativo": True
    }


@pytest.fixture
def recompensa_desconto():
    """Dados para criar uma recompensa tipo desconto"""
    return {
        "nome": "20% de desconto em produtos sustentáveis",
        "tipo": "desconto",
        "descricao": "Cupom de 20% de desconto em toda linha de produtos sustentáveis",
        "pontos_necessarios": 300,
        "estoque": 999,
        "ativo": True
    }


@pytest.fixture
def recompensa_db_mock():
    """Mock de recompensa como retornada do banco de dados"""
    return {
        "_id": ObjectId(),
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
def mock_collection():
    """Mock da collection do MongoDB"""
    return MagicMock()


# ========== TESTES DE MODELO ==========

def test_criar_recompensa_modelo_valido(recompensa_valida):
    """
    Testa criação de uma recompensa válida usando o modelo Pydantic.
    
    Given: Dados válidos de uma recompensa
    When: Criar instância do modelo Recompensa
    Then: O modelo deve ser criado com todos os campos corretos
    """
    # Act
    recompensa = Recompensa(**recompensa_valida)
    
    # Assert
    assert recompensa.nome == "Vale-compra R$ 50,00"
    assert recompensa.tipo == "voucher"
    assert recompensa.descricao == "Vale-compra de R$ 50,00 para usar em lojas parceiras"
    assert recompensa.pontos_necessarios == 500
    assert recompensa.foto_url == "https://example.com/vale50.jpg"
    assert recompensa.estoque == 100
    assert recompensa.parceiro == "Supermercado Verde"
    assert recompensa.ativo is True
    assert recompensa.data_cadastro is not None
    assert isinstance(recompensa.data_cadastro, datetime)


def test_criar_recompensa_com_valores_padrao():
    """
    Testa criação de recompensa com valores padrão.
    
    Given: Dados mínimos necessários para criar uma recompensa
    When: Criar recompensa sem informar campos opcionais
    Then: Campos opcionais devem ter valores padrão corretos
    """
    # Arrange
    dados_minimos = {
        "nome": "Cupom de Desconto",
        "tipo": "cupom",
        "descricao": "Cupom de desconto para próxima compra",
        "pontos_necessarios": 100
    }
    
    # Act
    recompensa = Recompensa(**dados_minimos)
    
    # Assert
    assert recompensa.estoque == 999  # Valor padrão
    assert recompensa.ativo is True  # Valor padrão
    assert recompensa.foto_url is None  # Opcional
    assert recompensa.parceiro is None  # Opcional
    assert recompensa.data_cadastro is not None


def test_validacao_pontos_necessarios_maior_que_zero():
    """
    Testa validação de pontos_necessarios deve ser maior que zero.
    
    Given: Dados de recompensa com pontos_necessarios = 0
    When: Tentar criar a recompensa
    Then: Deve lançar ValidationError
    """
    # Arrange
    dados_invalidos = {
        "nome": "Recompensa Inválida",
        "tipo": "produto",
        "descricao": "Descrição teste",
        "pontos_necessarios": 0  # Inválido
    }
    
    # Act & Assert
    with pytest.raises(Exception):  # Pydantic ValidationError
        Recompensa(**dados_invalidos)


def test_validacao_estoque_nao_pode_ser_negativo():
    """
    Testa validação de estoque não pode ser negativo.
    
    Given: Dados de recompensa com estoque negativo
    When: Tentar criar a recompensa
    Then: Deve lançar ValidationError
    """
    # Arrange
    dados_invalidos = {
        "nome": "Produto Teste",
        "tipo": "produto",
        "descricao": "Descrição do produto teste",
        "pontos_necessarios": 100,
        "estoque": -10  # Inválido
    }
    
    # Act & Assert
    with pytest.raises(Exception):  # Pydantic ValidationError
        Recompensa(**dados_invalidos)


# ========== TESTES DE SCHEMA ==========

def test_schema_create_recompensa_valido(recompensa_valida):
    """
    Testa validação do schema de criação com dados válidos.
    
    Given: Dados válidos de recompensa
    When: Validar com RecompensaCreate schema
    Then: Schema deve aceitar os dados
    """
    # Act
    schema = RecompensaCreate(**recompensa_valida)
    
    # Assert
    assert schema.nome == "Vale-compra R$ 50,00"
    assert schema.tipo == "voucher"
    assert schema.pontos_necessarios == 500


def test_schema_create_normaliza_tipo_lowercase(recompensa_valida):
    """
    Testa que o tipo é normalizado para lowercase.
    
    Given: Dados com tipo em UPPERCASE
    When: Validar com schema
    Then: Tipo deve ser convertido para lowercase
    """
    # Arrange
    recompensa_valida["tipo"] = "VOUCHER"
    
    # Act
    schema = RecompensaCreate(**recompensa_valida)
    
    # Assert
    assert schema.tipo == "voucher"


def test_schema_create_rejeita_tipo_invalido(recompensa_valida):
    """
    Testa validação de tipo inválido.
    
    Given: Dados com tipo não permitido
    When: Validar com schema
    Then: Deve lançar ValidationError
    """
    # Arrange
    recompensa_valida["tipo"] = "tipo_invalido"
    
    # Act & Assert
    with pytest.raises(Exception):  # Pydantic ValidationError
        RecompensaCreate(**recompensa_valida)


def test_schema_update_todos_campos_opcionais():
    """
    Testa que o schema de update permite todos os campos opcionais.
    
    Given: Schema de update vazio
    When: Criar instância sem nenhum campo
    Then: Deve ser válido (todos campos são opcionais)
    """
    # Act
    schema = RecompensaUpdate()
    
    # Assert
    assert schema.nome is None
    assert schema.tipo is None
    assert schema.descricao is None
    assert schema.pontos_necessarios is None
    assert schema.estoque is None
    assert schema.ativo is None


def test_schema_update_parcial():
    """
    Testa atualização parcial de recompensa.
    
    Given: Apenas alguns campos para atualizar
    When: Criar schema de update
    Then: Apenas campos informados devem ser preenchidos
    """
    # Arrange
    dados_parciais = {
        "estoque": 50,
        "ativo": False
    }
    
    # Act
    schema = RecompensaUpdate(**dados_parciais)
    
    # Assert
    assert schema.estoque == 50
    assert schema.ativo is False
    assert schema.nome is None  # Não informado
    assert schema.pontos_necessarios is None  # Não informado


# ========== TESTES DE REPOSITÓRIO ==========

@pytest.mark.asyncio
async def test_criar_recompensa_repositorio(recompensa_valida):
    """
    Testa criação de recompensa no repositório.
    
    Given: Dados válidos de recompensa
    When: Chamar criar_recompensa no repositório
    Then: Deve retornar ID da recompensa criada
    """
    # Arrange
    mock_inserted_id = ObjectId()
    
    with patch.object(recompensa_repo, '_collection') as mock_coll:
        mock_coll.return_value.insert_one = AsyncMock(
            return_value=MagicMock(inserted_id=mock_inserted_id)
        )
        
        # Act
        result_id = await recompensa_repo.criar_recompensa(recompensa_valida)
        
        # Assert
        assert result_id == str(mock_inserted_id)
        mock_coll.return_value.insert_one.assert_called_once_with(recompensa_valida)


@pytest.mark.asyncio
async def test_buscar_recompensa_por_id(recompensa_db_mock):
    """
    Testa busca de recompensa por ID.
    
    Given: ID de uma recompensa existente
    When: Buscar no repositório
    Then: Deve retornar a recompensa com campos corretos
    """
    # Arrange
    recompensa_id = str(recompensa_db_mock["_id"])
    
    with patch.object(recompensa_repo, '_collection') as mock_coll:
        mock_coll.return_value.find_one = AsyncMock(return_value=recompensa_db_mock)
        
        # Act
        result = await recompensa_repo.buscar_por_id(recompensa_id)
        
        # Assert
        assert result is not None
        assert result["nome"] == "Vale-compra R$ 50,00"
        assert result["tipo"] == "voucher"
        assert result["id"] == str(recompensa_db_mock["_id"])


@pytest.mark.asyncio
async def test_buscar_recompensa_id_invalido():
    """
    Testa busca com ID inválido.
    
    Given: ID inválido (não é ObjectId válido)
    When: Buscar no repositório
    Then: Deve retornar None
    """
    # Act
    result = await recompensa_repo.buscar_por_id("id_invalido_123")
    
    # Assert
    assert result is None


@pytest.mark.asyncio
async def test_listar_recompensas_ativas():
    """
    Testa listagem de recompensas ativas.
    
    Given: Recompensas no banco (ativas e inativas)
    When: Listar apenas ativas
    Then: Deve retornar apenas recompensas com ativo=True
    """
    # Arrange
    mock_recompensas = [
        {
            "_id": ObjectId(),
            "nome": "Recompensa 1",
            "tipo": "produto",
            "pontos_necessarios": 100,
            "ativo": True
        },
        {
            "_id": ObjectId(),
            "nome": "Recompensa 2",
            "tipo": "voucher",
            "pontos_necessarios": 200,
            "ativo": True
        }
    ]
    
    with patch.object(recompensa_repo, '_collection') as mock_coll:
        mock_cursor = MagicMock()
        mock_cursor.to_list = AsyncMock(return_value=mock_recompensas)
        mock_coll.return_value.find.return_value.skip.return_value.limit.return_value.sort.return_value = mock_cursor
        
        # Act
        result = await recompensa_repo.listar_recompensas_ativas()
        
        # Assert
        assert len(result) == 2
        assert all(r["ativo"] for r in result)


@pytest.mark.asyncio
async def test_listar_recompensas_com_estoque():
    """
    Testa listagem de recompensas com estoque disponível.
    
    Given: Recompensas com diferentes estoques
    When: Listar com filtro com_estoque=True
    Then: Deve aplicar filtro estoque > 0 na query
    """
    # Arrange
    mock_recompensas = [
        {
            "_id": ObjectId(),
            "nome": "Recompensa Disponível",
            "estoque": 50,
            "ativo": True
        }
    ]
    
    with patch.object(recompensa_repo, '_collection') as mock_coll:
        mock_cursor = MagicMock()
        mock_cursor.to_list = AsyncMock(return_value=mock_recompensas)
        mock_coll.return_value.find.return_value.skip.return_value.limit.return_value.sort.return_value = mock_cursor
        
        # Act
        result = await recompensa_repo.listar_recompensas_ativas(com_estoque=True)
        
        # Assert
        # Verifica que foi chamado com query incluindo filtro de estoque
        call_args = mock_coll.return_value.find.call_args[0][0]
        assert "estoque" in call_args
        assert call_args["estoque"] == {"$gt": 0}


@pytest.mark.asyncio
async def test_listar_todas_recompensas():
    """
    Testa listagem de todas as recompensas (ativas e inativas).
    
    Given: Recompensas no banco com diferentes status
    When: Listar todas
    Then: Deve retornar todas sem filtrar por status
    """
    # Arrange
    mock_recompensas = [
        {
            "_id": ObjectId(),
            "nome": "Recompensa Ativa",
            "tipo": "produto",
            "pontos_necessarios": 100,
            "ativo": True
        },
        {
            "_id": ObjectId(),
            "nome": "Recompensa Inativa",
            "tipo": "voucher",
            "pontos_necessarios": 200,
            "ativo": False
        }
    ]
    
    with patch.object(recompensa_repo, '_collection') as mock_coll:
        mock_cursor = MagicMock()
        mock_cursor.to_list = AsyncMock(return_value=mock_recompensas)
        mock_coll.return_value.find.return_value.skip.return_value.limit.return_value.sort.return_value = mock_cursor
        
        # Act
        result = await recompensa_repo.listar_todas_recompensas()
        
        # Assert
        assert len(result) == 2
        # Verifica que foi chamado com query vazia (sem filtros)
        call_args = mock_coll.return_value.find.call_args[0][0]
        assert call_args == {}


@pytest.mark.asyncio
async def test_atualizar_recompensa():
    """
    Testa atualização de campos de uma recompensa.
    
    Given: Recompensa existente
    When: Atualizar alguns campos
    Then: Deve chamar update_one com os campos corretos
    """
    # Arrange
    recompensa_id = str(ObjectId())
    updates = {"estoque": 75, "ativo": False}
    
    with patch.object(recompensa_repo, '_collection') as mock_coll:
        mock_coll.return_value.update_one = AsyncMock(
            return_value=MagicMock(matched_count=1)
        )
        
        # Act
        result = await recompensa_repo.atualizar_recompensa(recompensa_id, updates)
        
        # Assert
        assert result is True
        mock_coll.return_value.update_one.assert_called_once()


@pytest.mark.asyncio
async def test_atualizar_estoque():
    """
    Testa atualização de estoque (incremento ou decremento).
    
    Given: Recompensa existente
    When: Atualizar estoque usando $inc
    Then: Deve incrementar/decrementar corretamente
    """
    # Arrange
    recompensa_id = str(ObjectId())
    quantidade = 10  # Adicionar 10 ao estoque
    
    with patch.object(recompensa_repo, '_collection') as mock_coll:
        mock_coll.return_value.update_one = AsyncMock(
            return_value=MagicMock(matched_count=1)
        )
        
        # Act
        result = await recompensa_repo.atualizar_estoque(recompensa_id, quantidade)
        
        # Assert
        assert result is True
        call_args = mock_coll.return_value.update_one.call_args[0]
        update_doc = call_args[1]
        assert update_doc == {"$inc": {"estoque": quantidade}}


@pytest.mark.asyncio
async def test_decrementar_estoque_com_sucesso():
    """
    Testa decremento de estoque com validação.
    
    Given: Recompensa com estoque suficiente
    When: Decrementar estoque
    Then: Deve decrementar e retornar True
    """
    # Arrange
    recompensa_id = str(ObjectId())
    quantidade = 1
    
    with patch.object(recompensa_repo, '_collection') as mock_coll:
        mock_coll.return_value.update_one = AsyncMock(
            return_value=MagicMock(matched_count=1)  # Sucesso
        )
        
        # Act
        result = await recompensa_repo.decrementar_estoque(recompensa_id, quantidade)
        
        # Assert
        assert result is True
        # Verifica que a query inclui validação de estoque suficiente
        call_args = mock_coll.return_value.update_one.call_args[0]
        query = call_args[0]
        assert "estoque" in query
        assert query["estoque"] == {"$gte": quantidade}


@pytest.mark.asyncio
async def test_decrementar_estoque_insuficiente():
    """
    Testa decremento com estoque insuficiente.
    
    Given: Recompensa com estoque insuficiente
    When: Tentar decrementar
    Then: Deve retornar False sem modificar
    """
    # Arrange
    recompensa_id = str(ObjectId())
    quantidade = 10
    
    with patch.object(recompensa_repo, '_collection') as mock_coll:
        mock_coll.return_value.update_one = AsyncMock(
            return_value=MagicMock(matched_count=0)  # Não encontrou/não atualizou
        )
        
        # Act
        result = await recompensa_repo.decrementar_estoque(recompensa_id, quantidade)
        
        # Assert
        assert result is False


@pytest.mark.asyncio
async def test_desativar_recompensa():
    """
    Testa desativação de recompensa (soft delete).
    
    Given: Recompensa ativa
    When: Desativar recompensa
    Then: Deve marcar ativo=False
    """
    # Arrange
    recompensa_id = str(ObjectId())
    
    with patch.object(recompensa_repo, '_collection') as mock_coll:
        mock_coll.return_value.update_one = AsyncMock(
            return_value=MagicMock(matched_count=1)
        )
        
        # Act
        result = await recompensa_repo.desativar_recompensa(recompensa_id)
        
        # Assert
        assert result is True
        call_args = mock_coll.return_value.update_one.call_args[0]
        update_doc = call_args[1]
        assert update_doc == {"$set": {"ativo": False}}


@pytest.mark.asyncio
async def test_ativar_recompensa():
    """
    Testa reativação de recompensa.
    
    Given: Recompensa inativa
    When: Ativar recompensa
    Then: Deve marcar ativo=True
    """
    # Arrange
    recompensa_id = str(ObjectId())
    
    with patch.object(recompensa_repo, '_collection') as mock_coll:
        mock_coll.return_value.update_one = AsyncMock(
            return_value=MagicMock(matched_count=1)
        )
        
        # Act
        result = await recompensa_repo.ativar_recompensa(recompensa_id)
        
        # Assert
        assert result is True
        call_args = mock_coll.return_value.update_one.call_args[0]
        update_doc = call_args[1]
        assert update_doc == {"$set": {"ativo": True}}


@pytest.mark.asyncio
async def test_deletar_recompensa():
    """
    Testa deleção permanente de recompensa.
    
    Given: Recompensa existente
    When: Deletar recompensa
    Then: Deve remover do banco e retornar True
    """
    # Arrange
    recompensa_id = str(ObjectId())
    
    with patch.object(recompensa_repo, '_collection') as mock_coll:
        mock_coll.return_value.delete_one = AsyncMock(
            return_value=MagicMock(deleted_count=1)
        )
        
        # Act
        result = await recompensa_repo.deletar_recompensa(recompensa_id)
        
        # Assert
        assert result is True
        mock_coll.return_value.delete_one.assert_called_once()
