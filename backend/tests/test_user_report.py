import pytest
from unittest.mock import AsyncMock, patch

from src.service.user_service import UserService


@pytest.fixture
def mock_user_repo():
    with patch('src.service.user_service.user_repo') as mock:
        mock.find_by_id = AsyncMock()
        yield mock


@pytest.fixture
def mock_residue_repo():
    with patch('src.service.user_service.residue_repo') as mock:
        mock.list_residues = AsyncMock()
        mock.find_by_id = AsyncMock()
        yield mock


@pytest.fixture
def mock_categoria_repo():
    with patch('src.service.user_service.categoria_repo') as mock:
        mock.buscar_por_id = AsyncMock()
        yield mock


@pytest.mark.asyncio
async def test_generate_report_produtor(mock_user_repo, mock_residue_repo, mock_categoria_repo):
    # Arrange: usuário produtor
    produtor_id = "produtor123"
    mock_user_repo.find_by_id.return_value = {
        "_id": produtor_id,
        "role_id": "produtor",
        "name": "Indústria Teste",
        "email": "teste@industria.com"
    }

    # Dois resíduos em categorias diferentes e um resíduo adicional na mesma categoria
    mock_residue_repo.list_residues.return_value = [
        {"_id": "r1", "categoriaId": "cat1", "quantidade": 2},
        {"_id": "r2", "categoriaId": "cat2", "quantidade": 3.5},
        {"_id": "r3", "categoriaId": "cat1", "quantidade": 1}
    ]

    # Categoria nomes
    def buscar_por_id_side_effect(cat_id):
        mapping = {
            "cat1": {"_id": "cat1", "tipo": "plastico"},
            "cat2": {"_id": "cat2", "tipo": "papel"}
        }
        return mapping.get(cat_id)

    mock_categoria_repo.buscar_por_id.side_effect = buscar_por_id_side_effect

    # Act
    result = await UserService.generate_report(produtor_id)

    # Assert
    assert "by_category" in result
    by_cat = {item["categoria"]: item["quantidade"] for item in result["by_category"]}
    assert by_cat.get("plastico") == pytest.approx(3.0)
    assert by_cat.get("papel") == pytest.approx(3.5)


@pytest.mark.asyncio
async def test_generate_report_receptor_returns_empty(
    mock_user_repo, mock_entrega_repo, mock_categoria_repo
):
    # Arrange: usuário receptora
    receptor_id = "receptor123"
    mock_user_repo.find_by_id.return_value = {
        "_id": receptor_id,
        "role_id": "receptor",
        "name": "Ponto Receptor",
        "email": "ponto@receptor.com"
    }

    # Entrega repo returns no entregas
    mock_entrega_repo.find_by_receptora_id.return_value = []

    # Act
    result = await UserService.generate_report(receptor_id)

    # Assert
    assert "by_category" in result
    assert isinstance(result["by_category"], list)
    assert len(result["by_category"]) == 0


@pytest.fixture
def mock_entrega_repo():
    with patch('src.service.user_service.entrega_repo') as mock:
        mock.find_by_receptora_id = AsyncMock()
        yield mock


@pytest.mark.asyncio
async def test_generate_report_receptor_aggregation(
    mock_user_repo, mock_entrega_repo, mock_residue_repo, mock_categoria_repo
):
    # Arrange: receptor with multiple entregas
    receptor_id = "receptor123"
    mock_user_repo.find_by_id.return_value = {
        "_id": receptor_id,
        "role_id": "receptor",
        "name": "Ponto Receptor",
        "email": "ponto@receptor.com"
    }

    # Entregas recebidas (note: res2 appears twice across entregas)
    mock_entrega_repo.find_by_receptora_id.return_value = [
        {"_id": "e1", "residuos_id": ["res1", "res2"]},
        {"_id": "e2", "residuos_id": ["res3", "res2"]}
    ]

    # Residues returned by id
    residues_map = {
        "res1": {"_id": "res1", "categoriaId": "cat1", "quantidade": 2},
        "res2": {"_id": "res2", "categoriaId": "cat2", "quantidade": 4},
        "res3": {"_id": "res3", "categoriaId": "cat1", "quantidade": 1.5}
    }

    async def find_by_id_side_effect(rid):
        return residues_map.get(rid)

    mock_residue_repo.find_by_id.side_effect = find_by_id_side_effect

    # Categories
    def buscar_por_id_side_effect(cat_id):
        mapping = {
            "cat1": {"_id": "cat1", "tipo": "plastico"},
            "cat2": {"_id": "cat2", "tipo": "papel"}
        }
        return mapping.get(cat_id)

    mock_categoria_repo.buscar_por_id.side_effect = buscar_por_id_side_effect

    # Act
    result = await UserService.generate_report(receptor_id)

    # Assert aggregated by category
    assert "by_category" in result
    by_cat = {item["categoria"]: item["quantidade"] for item in result["by_category"]}
    assert by_cat.get("plastico") == pytest.approx(3.5)
    assert by_cat.get("papel") == pytest.approx(4.0)

    # Assert residues list present and contains unique residues fetched
    assert "residuos" in result
    res_ids = {r.get("_id") for r in result["residuos"]}
    assert res_ids == {"res1", "res2", "res3"}
