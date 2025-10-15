from typing import Optional, Dict, Any, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection

from src.infra.database.config.database import get_database


def _collection() -> AsyncIOMotorCollection:
    """Retorna a collection de histórico de resíduos do MongoDB"""
    return get_database()["historico_residuos"]


def _to_response(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Converte documento do MongoDB para formato de resposta.
    Serializa ObjectId para string.
    """
    if not doc:
        return None
    _id = doc.get("_id")
    id_str = str(_id) if isinstance(_id, ObjectId) else _id
    # Retorna ambos '_id' e 'id' para compatibilidade
    return {**doc, "_id": id_str, "id": id_str}


def _to_response_many(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Converte múltiplos documentos para formato de resposta"""
    return [d for d in map(_to_response, docs) if d is not None]


async def criar_historico(doc: Dict[str, Any]) -> str:
    """
    Registra um evento no histórico do resíduo.
    Implementa Observer Pattern: registra automaticamente mudanças de estado.
    
    Args:
        doc: Documento do histórico contendo:
            - residuo_id: ID do resíduo
            - acao: Tipo de ação (CRIADO, AGENDADO, COLETADO, ENTREGUE)
            - usuario_id: Quem realizou a ação
            - data_acao: Timestamp da ação
            - detalhes: Informações adicionais (opcional)
    
    Returns:
        str: ID do registro de histórico criado
    """
    result = await _collection().insert_one(doc)
    return str(result.inserted_id)


async def obter_historico(residuo_id: str, *, limit: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Recupera todo o histórico de um resíduo ordenado cronologicamente.
    
    Args:
        residuo_id: ID do resíduo
        limit: Limite de registros a retornar (None = todos)
    
    Returns:
        List[Dict]: Lista de eventos ordenados por data (mais antigo primeiro)
    """
    cursor = _collection().find({"residuo_id": residuo_id}).sort("data_acao", 1)
    if limit:
        docs = await cursor.to_list(length=limit)
    else:
        docs = await cursor.to_list(length=None)
    return _to_response_many(docs)


async def obter_ultima_acao(residuo_id: str) -> Optional[Dict[str, Any]]:
    """
    Recupera a última ação realizada no resíduo.
    Útil para validar transições de estado.
    
    Args:
        residuo_id: ID do resíduo
    
    Returns:
        Optional[Dict]: Último evento ou None se não houver histórico
    """
    doc = await _collection().find_one(
        {"residuo_id": residuo_id},
        sort=[("data_acao", -1)]
    )
    return _to_response(doc)


async def obter_por_acao(residuo_id: str, acao: str) -> List[Dict[str, Any]]:
    """
    Recupera todos os eventos de um tipo específico para um resíduo.
    
    Args:
        residuo_id: ID do resíduo
        acao: Tipo de ação (CRIADO, AGENDADO, COLETADO, ENTREGUE)
    
    Returns:
        List[Dict]: Lista de eventos do tipo especificado
    """
    cursor = _collection().find({
        "residuo_id": residuo_id,
        "acao": acao
    }).sort("data_acao", 1)
    docs = await cursor.to_list(length=None)
    return _to_response_many(docs)


async def obter_por_usuario(usuario_id: str, *, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
    """
    Recupera todas as ações realizadas por um usuário.
    Útil para auditoria e relatórios.
    
    Args:
        usuario_id: ID do usuário
        limit: Limite de registros
        skip: Quantidade de registros a pular
    
    Returns:
        List[Dict]: Lista de ações do usuário ordenadas por data (mais recentes primeiro)
    """
    cursor = _collection().find({"usuario_id": usuario_id}).skip(skip).limit(limit).sort("data_acao", -1)
    docs = await cursor.to_list(length=limit)
    return _to_response_many(docs)


async def contar_acoes_por_tipo(residuo_id: str) -> Dict[str, int]:
    """
    Conta quantas vezes cada tipo de ação ocorreu para um resíduo.
    Útil para estatísticas e validações.
    
    Args:
        residuo_id: ID do resíduo
    
    Returns:
        Dict[str, int]: Dicionário com contagem por tipo de ação
    """
    pipeline = [
        {"$match": {"residuo_id": residuo_id}},
        {"$group": {"_id": "$acao", "count": {"$sum": 1}}},
        {"$project": {"acao": "$_id", "count": 1, "_id": 0}}
    ]
    cursor = _collection().aggregate(pipeline)
    results = await cursor.to_list(length=None)
    return {r["acao"]: r["count"] for r in results}


async def deletar_historico_residuo(residuo_id: str) -> int:
    """
    Remove todo o histórico de um resíduo.
    Usado apenas quando o resíduo é permanentemente deletado.
    
    Args:
        residuo_id: ID do resíduo
    
    Returns:
        int: Quantidade de registros deletados
    """
    result = await _collection().delete_many({"residuo_id": residuo_id})
    return result.deleted_count
