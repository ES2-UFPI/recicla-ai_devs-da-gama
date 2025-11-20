from typing import Optional, Dict, Any, List
from datetime import datetime

from src.infra.database.config.database import get_database


def _users_collection():
    return get_database()["users"]


def _rankings_collection():
    return get_database()["rankings"]


async def get_users_sorted_by_ranking(filter_query: Optional[Dict[str, Any]] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
    """Retorna uma lista de usuários ordenados por 'ranking' decrescente.

    filter_query: dicionário opcional com filtros como {'cidade_id': 'teresina'} ou {'estado_id': 'pi'}
    limit: se fornecido, retorna somente os N primeiros
    """
    q = filter_query or {}
    cursor = _users_collection().find(q).sort("ranking", -1)
    if limit and isinstance(limit, int):
        cursor = cursor.limit(limit)

    # Convert cursor to list of dicts. Motor cursor is async; use to_list
    docs = await cursor.to_list(length=limit or 1000)

    # Ensure ids are string and return
    result = []
    for d in docs:
        # leave other fields as-is; tests often expect '_id' or 'id' fields
        result.append(d)
    return result


async def set_ranking(level: str = "global", code: Optional[str] = None, limit: Optional[int] = 10) -> Dict[str, Any]:
    """Calcula e salva o ranking na coleção 'rankings'.

    level: 'global'|'estado'|'cidade'
    code: código do nível (estado ou cidade) — ignorado para 'global'
    limit: número de entradas máximas a salvar
    """
    filter_query = None
    if level == "estado":
        filter_query = {"estado_id": code}
    elif level == "cidade":
        filter_query = {"cidade_id": code}

    users = await get_users_sorted_by_ranking(filter_query=filter_query, limit=limit)

    ranking_doc = {
        "level": level,
        "code": code,
        "generated_at": datetime.utcnow(),
        "limit": limit,
        "top": [{"user_id": u.get("_id") or u.get("id"), "points": int(u.get("points", 0))} for u in users],
    }

    # Upsert into rankings collection
    await _rankings_collection().update_one({"level": level, "code": code}, {"$set": ranking_doc}, upsert=True)

    return ranking_doc


async def get_ranking(level: str = "global", code: Optional[str] = None, limit: Optional[int] = 10) -> Optional[Dict[str, Any]]:
    """Retorna o ranking armazenado para o nível/código informado; se inexistente, calcula e salva.

    Retorna um dict similar ao retornado por set_ranking.
    """
    doc = await _rankings_collection().find_one({"level": level, "code": code})
    if doc:
        # Optionally limit top
        if limit and isinstance(limit, int):
            doc["top"] = doc.get("top", [])[:limit]
        return doc

    # Not found: compute
    return await set_ranking(level=level, code=code, limit=limit)

# Backwards compatibility aliases (English) kept for older imports
# Nota: mantemos nomes em inglês nas funções públicas para compatibilidade com tests/serviços
