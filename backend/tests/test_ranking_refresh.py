import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime

from src.service.coleta_service import ColetaService
from src.infra.database.models.enums import EstadoColeta, StatusResiduo


@pytest.mark.asyncio
async def test_refresh_ranking_called_when_producer_points_updated(mocker):
    service = ColetaService()

    coleta_id = "coleta1"
    coletor_id = "coletor1"
    residuo_ids = ["res1"]

    mock_coleta = {
        "_id": coleta_id,
        "id": coleta_id,
        "agendamento_id": "agend1",
        "produtor_id": "prod1",
        "coletor_id": coletor_id,
        "residuos_id": residuo_ids,
        "data_hora": datetime.utcnow(),
        "local": {"address_id": 1},
        "estado": EstadoColeta.EM_ANDAMENTO,
    }

    mock_residuo = {"_id": "res1", "status": StatusResiduo.RESERVADO, "produtorId": "prod1", "valorEstimado": 10}
    mock_produtor_db = {"_id": "prod1", "id": "prod1", "points": 0, "cidade_id": "teresina", "estado_id": "pi"}

    mocker.patch("src.service.coleta_service.coleta_repo.find_by_id", return_value=mock_coleta)
    mocker.patch("src.service.coleta_service.residue_repo.find_by_id", return_value=mock_residuo)
    mocker.patch("src.service.coleta_service.residue_repo.atualizar_status", new_callable=AsyncMock)
    mocker.patch("src.service.coleta_service.user_repo.find_by_id", return_value=mock_produtor_db)
    mocker.patch("src.service.coleta_service.user_repo.update_user", new_callable=AsyncMock)

    # Patch RankingService.refresh_ranking imported in ColetaService
    mock_refresh = mocker.patch("src.service.coleta_service.RankingService.refresh_ranking", new_callable=AsyncMock)

    # Act
    await service.coletar_residuo(coleta_id, residuo_ids, coletor_id)

    # Assert: refresh should be called at least once (global) and state/city
    assert mock_refresh.call_count >= 3
    # Validate a global update was requested
    assert any(call.kwargs.get("level") == "global" or (len(call.args) > 0 and call.args[0] == "global") for call in mock_refresh.call_args_list)
    # Validate state update
    assert any(call.kwargs.get("level") == "estado" or (len(call.args) > 0 and call.args[0] == "estado") for call in mock_refresh.call_args_list)
    # Validate city update
    assert any(call.kwargs.get("level") == "cidade" or (len(call.args) > 0 and call.args[0] == "cidade") for call in mock_refresh.call_args_list)
 