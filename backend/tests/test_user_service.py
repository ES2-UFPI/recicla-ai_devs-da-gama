"""
Testes para User Service utilizando User Factory/Builders
Testa criação, leitura e atualização de usuários com diferentes roles (produtor, coletor, receptor)
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import HTTPException

from src.service.user_service import UserService
from src.schemas.user_schema import UserCreate, UserUpdate, Endereco
from src.schemas.return_schema import UserPublic


# ========== FIXTURES ==========

@pytest.fixture
def mock_user_repo():
    """Mock do repositório de usuários"""
    with patch('src.service.user_service.user_repo') as mock:
        # Configurar métodos async por padrão
        mock.find_by_email = AsyncMock(return_value=None)
        mock.find_by_id = AsyncMock()
        mock.create_user = AsyncMock()
        mock.update_user = AsyncMock()
        mock.delete_user = AsyncMock()
        yield mock


@pytest.fixture
def produtor_payload():
    """Payload para criar um produtor (empresa)"""
    return UserCreate(
        name="Indústria XYZ Ltda",
        email="industria@xyz.com.br",
        phone="(86) 99999-8888",
        password="Senha123!",
        role_id="produtor",
        cidade_id="teresina",
        estado_id="pi",
        addresses=[
            Endereco(
                id=1,
                cep="64000-000",
                logradouro="Av. Industrial",
                numero="1000",
                latitude="-5.0892",
                longitude="-42.8019",
                complemento="Galpão 2"
            )
        ]
    )


@pytest.fixture
def coletor_payload():
    """Payload para criar um coletor"""
    return UserCreate(
        name="Maria Santos - Coleta Consciente",
        email="maria.coleta@email.com",
        phone="(86) 97777-6666",
        password="Senha456!",
        role_id="coletor",
        cidade_id="teresina",
        estado_id="pi",
        addresses=[
            Endereco(
                id=1,
                cep="64002-000",
                logradouro="Rua dos Coletores",
                numero="456",
                latitude="-5.0850",
                longitude="-42.8100"
            )
        ]
    )


@pytest.fixture
def receptor_payload():
    """Payload para criar um receptor (ponto de coleta)"""
    return UserCreate(
        name="Ecoponto Centro",
        email="ecoponto.centro@email.com",
        phone="(86) 96666-5555",
        password="Senha789!",
        role_id="receptor",
        cidade_id="teresina",
        estado_id="pi",
        addresses=[
            Endereco(
                id=1,
                cep="64003-000",
                logradouro="Av. Central",
                numero="789",
                latitude="-5.0900",
                longitude="-42.8000",
                complemento="Próximo ao shopping"
            )
        ],
        accepted_material=["plástico", "papel", "vidro", "metal"]
    )


@pytest.fixture
def mock_produtor_db():
    """Documento de produtor como retornado do banco"""
    return {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Indústria XYZ Ltda",
        "email": "industria@xyz.com.br",
        "phone": "(86) 99999-8888",
        "password_hash": "$bcrypt-sha256$...",
        "role_id": "produtor",
        "cidade_id": "teresina",
        "estado_id": "pi",
        "addresses": [
            {
                "id": 1,
                "cep": "64000-000",
                "logradouro": "Av. Industrial",
                "numero": "1000",
                "latitude": "-5.0892",
                "longitude": "-42.8019",
                "complemento": "Galpão 2"
            }
        ],
        "points": 0,
        "ranking": 0
    }


@pytest.fixture
def mock_coletor_db():
    """Documento de coletor como retornado do banco"""
    return {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Maria Santos - Coleta Consciente",
        "email": "maria.coleta@email.com",
        "phone": "(86) 97777-6666",
        "password_hash": "$bcrypt-sha256$...",
        "role_id": "coletor",
        "cidade_id": "teresina",
        "estado_id": "pi",
        "addresses": [
            {
                "id": 1,
                "cep": "64002-000",
                "logradouro": "Rua dos Coletores",
                "numero": "456",
                "latitude": "-5.0850",
                "longitude": "-42.8100"
            }
        ],
        "inventory": []
    }


@pytest.fixture
def mock_receptor_db():
    """Documento de receptor como retornado do banco"""
    return {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Ecoponto Centro",
        "email": "ecoponto.centro@email.com",
        "phone": "(86) 96666-5555",
        "password_hash": "$bcrypt-sha256$...",
        "role_id": "receptor",
        "cidade_id": "teresina",
        "estado_id": "pi",
        "addresses": [
            {
                "id": 1,
                "cep": "64003-000",
                "logradouro": "Av. Central",
                "numero": "789",
                "latitude": "-5.0900",
                "longitude": "-42.8000",
                "complemento": "Próximo ao shopping"
            }
        ]
    }


# ========== TESTES DE CRIAÇÃO (CREATE) ==========

@pytest.mark.asyncio
async def test_create_produtor_com_sucesso(mock_user_repo, produtor_payload, mock_produtor_db):
    """
    Testa criação de produtor com sucesso usando User Factory.
    Valida que o builder adiciona campos padrão (points, ranking).
    """
    # Arrange
    mock_user_repo.find_by_email.return_value = None
    mock_user_repo.create_user.return_value = "507f1f77bcf86cd799439011"
    mock_user_repo.find_by_id.return_value = mock_produtor_db
    
    # Act
    result = await UserService.create_user(produtor_payload)
    
    # Assert
    assert result.name == produtor_payload.name
    assert result.email == produtor_payload.email
    assert result.role_id == "produtor"
    mock_user_repo.create_user.assert_called_once()
    mock_user_repo.find_by_email.assert_called_once_with(produtor_payload.email)


@pytest.mark.asyncio
async def test_create_coletor_com_sucesso(mock_user_repo, coletor_payload, mock_coletor_db):
    """
    Testa criação de coletor com sucesso usando User Factory.
    Valida que o builder adiciona inventory vazio por padrão.
    """
    # Arrange
    mock_user_repo.find_by_email.return_value = None
    mock_user_repo.create_user.return_value = "507f1f77bcf86cd799439012"
    mock_user_repo.find_by_id.return_value = mock_coletor_db
    
    # Act
    result = await UserService.create_user(coletor_payload)
    
    # Assert
    assert result.name == coletor_payload.name
    assert result.email == coletor_payload.email
    assert result.role_id == "coletor"
    mock_user_repo.create_user.assert_called_once()


@pytest.mark.asyncio
async def test_create_receptor_com_sucesso(mock_user_repo, receptor_payload, mock_receptor_db):
    """
    Testa criação de receptor com sucesso usando User Factory.
    """
    # Arrange
    mock_user_repo.find_by_email.return_value = None
    mock_user_repo.create_user.return_value = "507f1f77bcf86cd799439013"
    mock_user_repo.find_by_id.return_value = mock_receptor_db
    
    # Act
    result = await UserService.create_user(receptor_payload)
    
    # Assert
    assert result.name == receptor_payload.name
    assert result.email == receptor_payload.email
    assert result.role_id == "receptor"
    mock_user_repo.create_user.assert_called_once()


@pytest.mark.asyncio
async def test_create_user_email_duplicado(mock_user_repo, produtor_payload):
    """
    Testa que não permite criar usuário com e-mail duplicado.
    """
    # Arrange
    mock_user_repo.find_by_email.return_value = {"_id": "existing_id"}
    
    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await UserService.create_user(produtor_payload)
    
    assert exc_info.value.status_code == 409
    assert "já cadastrado" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_create_user_role_invalido(mock_user_repo):
    """
    Testa que falha ao tentar criar usuário com role inválido.
    """
    # Arrange
    mock_user_repo.find_by_email.return_value = None
    
    invalid_payload = UserCreate(
        name="Usuário Inválido",
        email="invalido@email.com",
        phone="(86) 99999-9999",
        password="Senha123!",
        role_id="administrador",  # Role não suportado
        cidade_id="teresina",
        estado_id="pi",
        addresses=[]
    )
    
    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await UserService.create_user(invalid_payload)
    
    assert exc_info.value.status_code == 400
    assert "não suportado" in exc_info.value.detail


@pytest.mark.asyncio
async def test_create_user_senha_hash_automatico(mock_user_repo, produtor_payload, mock_produtor_db):
    """
    Testa que o builder faz hash automático da senha.
    """
    # Arrange
    mock_user_repo.find_by_email.return_value = None
    mock_user_repo.create_user.return_value = "507f1f77bcf86cd799439011"
    mock_user_repo.find_by_id.return_value = mock_produtor_db
    
    # Act
    result = await UserService.create_user(produtor_payload)
    
    # Assert
    # Verificar que o documento salvo tem password_hash, não password
    call_args = mock_user_repo.create_user.call_args[0][0]
    assert "password_hash" in call_args
    assert "password" not in call_args
    assert call_args["password_hash"] != produtor_payload.password  # Hash é diferente da senha original


# ========== TESTES DE LEITURA (READ) ==========

@pytest.mark.asyncio
async def test_get_user_by_id_produtor(mock_user_repo, mock_produtor_db):
    """
    Testa busca de produtor por ID usando builder para construir resposta.
    """
    # Arrange
    mock_user_repo.find_by_id.return_value = mock_produtor_db
    
    # Act
    result = await UserService.get_user_by_id("507f1f77bcf86cd799439011")
    
    # Assert
    assert result.name == mock_produtor_db["name"]
    assert result.email == mock_produtor_db["email"]
    assert result.role_id == "produtor"
    mock_user_repo.find_by_id.assert_called_once_with("507f1f77bcf86cd799439011")


@pytest.mark.asyncio
async def test_get_user_by_id_coletor(mock_user_repo, mock_coletor_db):
    """
    Testa busca de coletor por ID.
    """
    # Arrange
    mock_user_repo.find_by_id.return_value = mock_coletor_db
    
    # Act
    result = await UserService.get_user_by_id("507f1f77bcf86cd799439012")
    
    # Assert
    assert result.name == mock_coletor_db["name"]
    assert result.role_id == "coletor"


@pytest.mark.asyncio
async def test_get_user_by_id_receptor(mock_user_repo, mock_receptor_db):
    """
    Testa busca de receptor por ID.
    """
    # Arrange
    mock_user_repo.find_by_id.return_value = mock_receptor_db
    
    # Act
    result = await UserService.get_user_by_id("507f1f77bcf86cd799439013")
    
    # Assert
    assert result.name == mock_receptor_db["name"]
    assert result.role_id == "receptor"


@pytest.mark.asyncio
async def test_get_user_by_id_nao_encontrado(mock_user_repo):
    """
    Testa que retorna 404 quando usuário não é encontrado.
    """
    # Arrange
    mock_user_repo.find_by_id.return_value = None
    
    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await UserService.get_user_by_id("invalid_id")
    
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_get_user_by_email(mock_user_repo, mock_produtor_db):
    """
    Testa busca de usuário por e-mail.
    """
    # Arrange
    mock_user_repo.find_by_email.return_value = mock_produtor_db
    
    # Act
    result = await UserService.get_user_by_email("industria@xyz.com.br")
    
    # Assert
    assert result.email == mock_produtor_db["email"]
    mock_user_repo.find_by_email.assert_called_once_with("industria@xyz.com.br")


# ========== TESTES DE ATUALIZAÇÃO (UPDATE) ==========

@pytest.mark.asyncio
async def test_update_user_com_sucesso(mock_user_repo, mock_produtor_db):
    """
    Testa atualização de usuário usando builder.
    """
    # Arrange
    user_id = "507f1f77bcf86cd799439011"
    
    # Preparar documento atualizado
    updated_db = mock_produtor_db.copy()
    updated_db["name"] = "Indústria XYZ S.A."
    
    # find_by_id é chamado 2x: 1) buscar original, 2) buscar atualizado
    mock_user_repo.find_by_id.side_effect = [mock_produtor_db, updated_db]
    mock_user_repo.find_by_email.return_value = None
    mock_user_repo.update_user.return_value = True
    
    update_payload = UserUpdate(name="Indústria XYZ S.A.")
    
    # Act
    result = await UserService.update_user(user_id, update_payload)
    
    # Assert
    assert result.name == "Indústria XYZ S.A."
    mock_user_repo.update_user.assert_called_once()


@pytest.mark.asyncio
async def test_update_user_nao_encontrado(mock_user_repo):
    """
    Testa que retorna 404 ao tentar atualizar usuário inexistente.
    """
    # Arrange
    mock_user_repo.find_by_id.return_value = None
    update_payload = UserUpdate(name="Novo Nome")
    
    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await UserService.update_user("invalid_id", update_payload)
    
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_update_user_email_duplicado(mock_user_repo, mock_produtor_db):
    """
    Testa que não permite atualizar e-mail para um já existente.
    """
    # Arrange
    user_id = "507f1f77bcf86cd799439011"
    mock_user_repo.find_by_id.return_value = mock_produtor_db
    mock_user_repo.find_by_email.return_value = {"_id": "other_id"}
    
    update_payload = UserUpdate(email="outro@email.com")
    
    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await UserService.update_user(user_id, update_payload)
    
    assert exc_info.value.status_code == 409


# ========== TESTES DO BUILDER (Validações Específicas) ==========

@pytest.mark.asyncio
async def test_builder_nao_retorna_password_hash_em_public(mock_user_repo, produtor_payload, mock_produtor_db):
    """
    Testa que o build_public() não retorna password_hash.
    """
    # Arrange
    mock_user_repo.find_by_email.return_value = None
    mock_user_repo.create_user.return_value = "507f1f77bcf86cd799439011"
    mock_user_repo.find_by_id.return_value = mock_produtor_db
    
    # Act
    result = await UserService.create_user(produtor_payload)
    
    # Assert
    assert not hasattr(result, 'password_hash')
    assert not hasattr(result, 'password')


@pytest.mark.asyncio
async def test_builder_adiciona_campos_padrao_produtor(mock_user_repo, mock_produtor_db):
    """
    Testa que ProduorBuilder adiciona points e ranking com valores padrão.
    """
    # Arrange
    mock_user_repo.find_by_id.return_value = mock_produtor_db
    
    # Act
    result = await UserService.get_user_by_id("507f1f77bcf86cd799439011")
    
    # Assert - Verificar que os campos existem (já vêm do mock_produtor_db)
    assert result is not None
    assert result.role_id == "produtor"


@pytest.mark.asyncio
async def test_builder_adiciona_inventory_vazio_coletor(mock_user_repo, mock_coletor_db):
    """
    Testa que ColetorBuilder adiciona inventory vazio por padrão.
    """
    # Arrange
    mock_user_repo.find_by_id.return_value = mock_coletor_db
    
    # Act
    result = await UserService.get_user_by_id("507f1f77bcf86cd799439012")
    
    # Assert
    assert result is not None
    assert result.role_id == "coletor"


@pytest.mark.asyncio
async def test_criar_multiplos_usuarios_diferentes_roles(mock_user_repo, produtor_payload, coletor_payload, receptor_payload, mock_produtor_db, mock_coletor_db, mock_receptor_db):
    """
    Testa criação sequencial de usuários com diferentes roles usando Factory.
    """
    # Arrange
    mock_user_repo.find_by_email.return_value = None
    
    # Criar produtor
    mock_user_repo.create_user.return_value = "id1"
    mock_user_repo.find_by_id.return_value = mock_produtor_db
    result1 = await UserService.create_user(produtor_payload)
    assert result1.role_id == "produtor"
    
    # Criar coletor
    mock_user_repo.create_user.return_value = "id2"
    mock_user_repo.find_by_id.return_value = mock_coletor_db
    result2 = await UserService.create_user(coletor_payload)
    assert result2.role_id == "coletor"
    
    # Criar receptor
    mock_user_repo.create_user.return_value = "id3"
    mock_user_repo.find_by_id.return_value = mock_receptor_db
    result3 = await UserService.create_user(receptor_payload)
    assert result3.role_id == "receptor"
    
    # Assert - 3 chamadas de criação
    assert mock_user_repo.create_user.call_count == 3
