import pytest
from unittest.mock import AsyncMock, patch

from src.service.ranking_service import RankingService
from src.schemas.ranking_schema import RankingEntry


def _make_user(i, ranking, cidade="teresina", estado="pi"):
	return {
		"_id": f"user{i}",
		"name": f"User {i}",
		"cidade_id": cidade,
		"estado_id": estado,
		"ranking": ranking,
	}


class TestRankingService:
	@pytest.mark.asyncio
	async def test_get_top10_global(self):
		# Cria 12 usuários com ranking decrescente (0..11)
		users = [ _make_user(i, ranking=100 - i) for i in range(12) ]

		# Mock do ranking_repo para retornar usuários ordenados
		with patch('src.service.ranking_service.ranking_repo') as mock_repo:
			# O service deve respeitar o argumento 'limit'
			mock_repo.get_users_sorted_by_ranking = AsyncMock(return_value=users[:10])

			response = await RankingService.get_top_ranking(level='global', limit=10)

			# Deve retornar um RankingResponse com no máximo 10 entradas
			assert response.level == 'global'
			assert len(response.top) == 10
			# Primeiro usuário deve ter o maior número de ranking (user0 => 100)
			assert response.top[0].user_id == 'user0'
			assert response.top[0].ranking == 100

	@pytest.mark.asyncio
	async def test_get_top10_by_state(self):
		# Usuários mistos em diferentes estados
		users = [ _make_user(i, ranking=50 - i, estado='pi') for i in range(5) ] + [ _make_user(i + 100, ranking=40 - i, estado='ma') for i in range(5) ]

		with patch('src.service.ranking_service.ranking_repo') as mock_repo:
			# ranking_repo deve retornar apenas usuários do estado solicitado
			mock_repo.get_users_sorted_by_ranking = AsyncMock(return_value=[u for u in users if u['estado_id'] == 'pi'])

			response = await RankingService.get_top_ranking(level='estado', code='pi', limit=10)

			assert response.level == 'estado'
			assert response.code == 'pi'
			# Espera apenas usuários do estado 'pi'
			assert all(u.estado_id == 'pi' for u in response.top)

	@pytest.mark.asyncio
	async def test_get_top10_by_city(self):
		users = [ _make_user(i, ranking=10 + i, cidade='teresina') for i in range(3) ]
		users += [ _make_user(i + 100, ranking=5 + i, cidade='outra') for i in range(3) ]

		with patch('src.service.ranking_service.ranking_repo') as mock_repo:
			mock_repo.get_users_sorted_by_ranking = AsyncMock(return_value=[u for u in users if u['cidade_id'] == 'teresina'])

			response = await RankingService.get_top_ranking(level='cidade', code='teresina', limit=10)

			assert response.level == 'cidade'
			assert response.code == 'teresina'
			assert len(response.top) == 3

	@pytest.mark.asyncio
	async def test_get_user_position_estado(self):
		users = [ _make_user(i, ranking=200 - i, estado='pi') for i in range(5) ]

		with patch('src.service.ranking_service.ranking_repo') as mock_repo:
			mock_repo.get_users_sorted_by_ranking = AsyncMock(return_value=users)

			pos = await RankingService.get_user_position('user3', level='estado', code='pi')
		assert pos == 4

	@pytest.mark.asyncio
	async def test_get_user_position_global_and_not_found(self):
		users = [ _make_user(i, ranking=200 - i) for i in range(5) ]

		with patch('src.service.ranking_service.ranking_repo') as mock_repo:
			mock_repo.get_users_sorted_by_ranking = AsyncMock(return_value=users)

			# user2 deve estar na posição 3
			pos = await RankingService.get_user_position('user2', level='global')
			assert pos == 3

			# usuário inexistente retorna -1
			nf = await RankingService.get_user_position('no-such-user', level='global')
			assert nf == -1
