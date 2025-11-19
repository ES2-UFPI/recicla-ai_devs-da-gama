from fastapi import APIRouter, Query
from typing import Optional, Dict

from src.schemas.ranking_schema import RankingResponse
from src.service.ranking_service import RankingService

router = APIRouter(prefix="/rankings", tags=["Ranking"])


@router.get("/", response_model=RankingResponse)
async def get_rankings(level: str = Query("global", description="global|estado|cidade"), code: Optional[str] = Query(None), limit: int = Query(10)):
    """Retorna ranking por nível (global, estado, cidade).

    - level: Nível do ranking (global | estado | cidade)
    - code: Código do estado ou cidade quando aplicável
    - limit: Quantos itens retornar no top
    """
    # Tenta usar ranking cacheado quando possível
    return await RankingService.get_cached_ranking(level=level, code=code, limit=limit)


@router.post("/refresh", response_model=RankingResponse)
async def refresh_rankings(level: str = Query("global"), code: Optional[str] = Query(None), limit: int = Query(10)):
    """Recalcula e salva o ranking para o nível especificado.

    Este endpoint pode ser usado por jobs/cron ou admin para atualizar os rankings.
    """
    return await RankingService.refresh_ranking(level=level, code=code, limit=limit)


@router.get("/position/{user_id}")
async def get_user_position(user_id: str, level: str = Query("global"), code: Optional[str] = Query(None)) -> Dict[str, int]:
    """Retorna a posição do usuário no ranking solicitado.

    Retorna um objeto: {"position": int}
    """
    pos = await RankingService.get_user_position(user_id=user_id, level=level, code=code)
    return {"position": pos}
