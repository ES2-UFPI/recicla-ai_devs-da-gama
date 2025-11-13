import pytest
from unittest.mock import AsyncMock, patch
from fastapi import HTTPException
from datetime import datetime

from src.service.entrega_service import EntregaService
from src.schemas.entrega_schema import EntregaCreate


# ========== FIXTURES ==========

@pytest.fixture
def mock_entrega_repo():
    """Mock do repositório de entregas"""
    with patch('src.service.entrega_service.entrega_repo') as mock:
        mock.create_entrega = AsyncMock()
        mock.find_by_id = AsyncMock()
        yield mock


@pytest.fixture
def mock_residue_repo():
    """Mock do repositório de resíduos"""
    with patch('src.service.entrega_service.residue_repo') as mock:
        mock.find_by_id = AsyncMock()
        # Assinatura correta: atualizar_status(residuo_id, novo_status, usuario_id, detalhes=None)
        mock.atualizar_status = AsyncMock(return_value=True)
        yield mock


@pytest.fixture
def mock_user_repo():
    """Mock do repositório de usuários"""
    with patch('src.service.entrega_service.user_repo') as mock:
        mock.find_by_id = AsyncMock()
        yield mock


@pytest.fixture
def mock_coletor_db():
    """Documento de coletor como retornado do banco"""
    return {
        "_id": "coletor123",
        "name": "Maria Coletora",
        "email": "maria@coletor.com",
        "role_id": "coletor",
        "inventory": ["residuo1", "residuo2"]
    }


@pytest.fixture
def mock_receptora_db():
    """Documento de receptora como retornado do banco"""
    return {
        "_id": "receptora456",
        "name": "Ecoponto Centro",
        "email": "ecoponto@centro.com",
        "role_id": "receptor",
        "accepted_material": ["plástico", "papel"]
    }


@pytest.fixture
def mock_residuos_db():
    """Lista de resíduos no inventário do coletor"""
    return [
        {
            "_id": "residuo1",
            "id": "residuo1",
            "categoriaId": "plastico",
            "quantidade": 5.0,
            "status": "COLETADO",  # Status correto: resíduo já foi coletado
            "produtorId": "produtor789"
        },
        {
            "_id": "residuo2", 
            "id": "residuo2",
            "categoriaId": "papel",
            "quantidade": 3.0,
            "status": "COLETADO",  # Status correto: resíduo já foi coletado
            "produtorId": "produtor789"
        }
    ]


@pytest.fixture
def entrega_payload():
    """Payload para criar uma entrega"""
    return EntregaCreate(
        receptora_id="receptora456",
        residuos_id=["residuo1", "residuo2"],
        observacoes="Entrega realizada com sucesso"
    )


@pytest.fixture
def mock_entrega_db():
    """Documento de entrega como retornado do banco"""
    return {
        "_id": "entrega789",
        "data_hora": datetime.utcnow(),
        "receptora_id": "receptora456",
        "coletor_id": "coletor123",
        "residuos_id": ["residuo1", "residuo2"],
        "categorias_residuos_entregues": ["plastico", "papel"],
        "observacoes": "Entrega realizada com sucesso"
    }


class TestEntregaColeta:
    
    @pytest.mark.asyncio
    async def test_entrega_correta(
        self,
        mock_entrega_repo,
        mock_residue_repo,
        mock_user_repo,
        entrega_payload,
        mock_coletor_db,
        mock_receptora_db,
        mock_residuos_db,
        mock_entrega_db
    ):
        """
        Testa uma entrega bem-sucedida de resíduos do coletor para a receptora.
        
        Cenário:
        - Coletor tem resíduos no inventário com status COLETADO
        - Receptora aceita as categorias dos resíduos
        - Todos os resíduos são válidos
        
        Resultado esperado:
        - Entrega é criada com sucesso
        - Status dos resíduos muda para ENTREGUE
        - Resíduos são removidos do inventário do coletor
        """
        # Arrange
        coletor_id = "coletor123"
        
        # Mock: encontrar coletor (3x: validação inicial, receptora, remover do inventory)
        # e receptora (1x: validação)
        mock_user_repo.find_by_id.side_effect = [
            mock_coletor_db,    # 1ª chamada: validação inicial do coletor
            mock_receptora_db,  # 2ª chamada: validação da receptora
            mock_coletor_db     # 3ª chamada: buscar coletor para remover do inventory
        ]
        
        # Mock: atualizar inventory do coletor
        mock_user_repo.update_user = AsyncMock(return_value=True)
        
        # Mock: encontrar resíduos (um de cada vez)
        mock_residue_repo.find_by_id.side_effect = mock_residuos_db
        
        # Mock: criar entrega e buscar entrega criada
        mock_entrega_repo.create_entrega.return_value = "entrega789"
        mock_entrega_repo.find_by_id.return_value = mock_entrega_db
        
        # Act
        result = await EntregaService.criar_entrega(coletor_id=coletor_id, entrega_payload=entrega_payload)
        
        # Assert
        assert result is not None, "Entrega deve ser criada e retornada"
        assert result.receptora_id == "receptora456", "ID da receptora deve estar correto"
        assert result.coletor_id == "coletor123", "ID do coletor deve estar correto"
        assert len(result.residuos_id) == 2, "Deve ter 2 resíduos entregues"
        assert "plastico" in result.categorias_residuos_entregues, "Categoria 'plastico' deve estar presente"
        assert "papel" in result.categorias_residuos_entregues, "Categoria 'papel' deve estar presente"
        
        # Verificar que create_entrega foi chamado uma vez
        mock_entrega_repo.create_entrega.assert_called_once()

        # Verificar que status dos resíduos foi atualizado para ENTREGUE (2 resíduos)
        # Assinatura real: atualizar_status(residuo_id, novo_status, usuario_id, detalhes)
        assert mock_residue_repo.atualizar_status.call_count == 2, "Status de 2 resíduos deve ser atualizado"
        
        # Verificar que foi chamado com os parâmetros corretos (StatusResiduo.ENTREGUE)
        calls = mock_residue_repo.atualizar_status.call_args_list
        for call in calls:
            args, kwargs = call
            # Como a chamada usa argumentos nomeados, verifica kwargs
            assert kwargs.get("novo_status") == "ENTREGUE", \
                "Status deve ser atualizado para ENTREGUE"
            assert "residuo_id" in kwargs, "Deve ter residuo_id nos argumentos"
            assert "usuario_id" in kwargs, "Deve ter usuario_id nos argumentos"
            assert kwargs["usuario_id"] == coletor_id, "usuario_id deve ser o coletor"

    @pytest.mark.asyncio
    async def test_entrega_sem_residuos(
        self,
        mock_entrega_repo,
        mock_residue_repo,
        mock_user_repo
    ):
        """
        Testa que não é possível criar entrega sem resíduos.
        
        Cenário:
        - Lista de resíduos está vazia
        
        Resultado esperado:
        - Levanta ValidationError do Pydantic
        """
        # Arrange
        coletor_id = "coletor123"
        
        # Act & Assert
        with pytest.raises(Exception) as exc_info:
            # Schema já valida que residuos_id não pode ser vazio
            EntregaCreate(
                receptora_id="receptora456",
                residuos_id=[],  # Lista vazia
                observacoes="Teste"
            )
        
        # Validação do Pydantic deve capturar
        assert "residuos_id" in str(exc_info.value).lower() or "pelo menos um resíduo" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_entrega_com_residuos_invalidos(
        self,
        mock_entrega_repo,
        mock_residue_repo,
        mock_user_repo,
        mock_coletor_db,
        mock_receptora_db,
        entrega_payload
    ):
        """
        Testa que não é possível entregar resíduos que não existem.
        
        Cenário:
        - Um ou mais resíduos na lista não existem no banco
        
        Resultado esperado:
        - Levanta HTTPException 404
        """
        # Arrange
        coletor_id = "coletor123"
        
        # Mock: coletor e receptora existem
        mock_user_repo.find_by_id.side_effect = [mock_coletor_db, mock_receptora_db]
        
        # Mock: primeiro resíduo existe, segundo não existe (retorna None)
        mock_residue_repo.find_by_id.side_effect = [
            {"_id": "residuo1", "categoriaId": "plastico", "status": "COLETADO"},
            None  # Resíduo não encontrado
        ]
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await EntregaService.criar_entrega(coletor_id=coletor_id, entrega_payload=entrega_payload)
        
        assert exc_info.value.status_code == 404
        assert "resíduo" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_entrega_para_receptora_inexistente(
        self,
        mock_entrega_repo,
        mock_residue_repo,
        mock_user_repo,
        mock_coletor_db,
        entrega_payload
    ):
        """
        Testa que não é possível entregar para receptora que não existe.
        
        Cenário:
        - Receptora ID fornecido não existe no banco
        
        Resultado esperado:
        - Levanta HTTPException 404
        """
        # Arrange
        coletor_id = "coletor123"
        
        # Mock: coletor existe, receptora NÃO existe
        mock_user_repo.find_by_id.side_effect = [
            mock_coletor_db,
            None  # Receptora não encontrada
        ]
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await EntregaService.criar_entrega(coletor_id=coletor_id, entrega_payload=entrega_payload)
        
        assert exc_info.value.status_code == 404
        assert "receptora" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_entrega_coletor_inexistente(
        self,
        mock_entrega_repo,
        mock_residue_repo,
        mock_user_repo,
        entrega_payload
    ):
        """
        Testa que não é possível criar entrega se coletor não existe.
        
        Cenário:
        - Coletor ID fornecido não existe no banco
        
        Resultado esperado:
        - Levanta HTTPException 404
        """
        # Arrange
        coletor_id = "coletor_invalido"
        
        # Mock: coletor NÃO existe
        mock_user_repo.find_by_id.return_value = None
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await EntregaService.criar_entrega(coletor_id=coletor_id, entrega_payload=entrega_payload)
        
        assert exc_info.value.status_code == 404
        assert "coletor" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_entrega_com_residuo_ja_entregue(
        self,
        mock_entrega_repo,
        mock_residue_repo,
        mock_user_repo,
        mock_coletor_db,
        mock_receptora_db,
        entrega_payload
    ):
        """
        Testa que não é possível entregar resíduo que já foi entregue.
        
        Cenário:
        - Resíduo já tem status ENTREGUE
        
        Resultado esperado:
        - Levanta HTTPException 400
        """
        # Arrange
        coletor_id = "coletor123"
        
        # Mock: coletor e receptora existem
        mock_user_repo.find_by_id.side_effect = [mock_coletor_db, mock_receptora_db]
        
        # Mock: resíduos já estão ENTREGUES
        mock_residue_repo.find_by_id.side_effect = [
            {"_id": "residuo1", "categoriaId": "plastico", "status": "ENTREGUE"},
            {"_id": "residuo2", "categoriaId": "papel", "status": "ENTREGUE"}
        ]
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await EntregaService.criar_entrega(coletor_id=coletor_id, entrega_payload=entrega_payload)
        
        assert exc_info.value.status_code == 400
        assert "status" in exc_info.value.detail.lower() or "entregue" in exc_info.value.detail.lower()