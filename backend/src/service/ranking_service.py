from typing import Optional, List
from src.schemas.ranking_schema import RankingEntry, RankingResponse
from src.infra.database.repositories import ranking_repo


class RankingService:
    """Serviço para cálculo de rankings.

    Implementação mínima — os testes descrevem o comportamento esperado.
    """

    @staticmethod
    async def get_top_ranking(level: str = "global", code: Optional[str] = None, limit: int = 10) -> RankingResponse:
        """Retorna o top do ranking.

        level: 'global'|'estado'|'cidade'
        code: quando nível for 'estado' ou 'cidade' informa o código (ex.: 'pi' ou 'teresina')
        """
        # Filtro base: apenas produtores
        filter_query = {"role_id": "produtor"}
        
        if level == "estado" and code:
            filter_query["estado_id"] = code
        elif level == "cidade" and code:
            filter_query["cidade_id"] = code

        # Buscar usuários ordenados por pontos no repositório
        users = await ranking_repo.get_users_sorted_by_points(filter_query=filter_query, limit=limit)

        # map to RankingEntry - converte ObjectId para string
        top = [RankingEntry(user_id=str(u.get("_id") or u.get("id")), name=u.get("name"), cidade_id=u.get("cidade_id"), estado_id=u.get("estado_id"), points=int(u.get("points", 0)), position=i + 1) for i, u in enumerate(users)]

        # Extrair nomes de cidade/estado do primeiro usuário (todos terão os mesmos valores no filtro)
        cidade_nome = None
        estado_nome = None
        if users and len(users) > 0:
            if level == "cidade":
                cidade_nome = users[0].get("cidade_id", "")  # Usa o valor exato do banco
            elif level == "estado":
                estado_nome = users[0].get("estado_id", "")  # Usa o valor exato do banco

        return RankingResponse(level=level, code=code, cidade_nome=cidade_nome, estado_nome=estado_nome, total=len(users), top=top)

    @staticmethod
    async def get_user_position(user_id: str, level: str = "global", code: Optional[str] = None) -> int:
        """Retorna a posição (1-based) do usuário no ranking do nível informado. Se não encontrado, retorna -1."""
        # Filtro base: apenas produtores
        filter_query = {"role_id": "produtor"}
        
        if level == "estado" and code:
            filter_query["estado_id"] = code
        elif level == "cidade" and code:
            filter_query["cidade_id"] = code

        users = await ranking_repo.get_users_sorted_by_points(filter_query=filter_query, limit=None)

        for idx, u in enumerate(users):
            if str(u.get("_id") or u.get("id")) == str(user_id):
                return idx + 1

        return -1

    @staticmethod
    async def refresh_ranking(level: str = "global", code: Optional[str] = None, limit: int = 10) -> RankingResponse:
        """Calcula e salva o ranking no banco, retornando o RankingResponse."""
        doc = await ranking_repo.set_ranking(level=level, code=code, limit=limit)
        # convert top - converte ObjectId para string
        top = [RankingEntry(user_id=str(t.get("user_id")), points=int(t.get("points", 0)), position=i + 1) for i, t in enumerate(doc.get("top", []))]
        return RankingResponse(level=level, code=code, cidade_nome=None, estado_nome=None, total=len(top), top=top)

    @staticmethod
    async def get_cached_ranking(level: str = "global", code: Optional[str] = None, limit: int = 10) -> RankingResponse:
        """Retorna ranking do armazenamento (cache). Caso não exista, calcula e salva antes de retornar."""
        # Cache não tem dados completos (name, cidade_id, estado_id), então busca do banco
        return await RankingService.get_top_ranking(level=level, code=code, limit=limit)
