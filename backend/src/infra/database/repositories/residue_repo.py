from typing import Optional, Dict, Any, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection

from src.infra.database.config.database import get_database


def _collection() -> AsyncIOMotorCollection:
    # Segue o padrão do user_repo usando nome em inglês
    return get_database()["residues"]


def _to_response(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    _id = doc.get("_id")
    return {**doc, "_id": str(_id) if isinstance(_id, ObjectId) else _id}


def _to_response_many(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [d for d in map(_to_response, docs) if d is not None]


async def create_residue(doc: Dict[str, Any]) -> str:
    result = await _collection().insert_one(doc)
    return str(result.inserted_id)


async def find_by_id(residue_id: str) -> Optional[Dict[str, Any]]:
    try:
        _id = ObjectId(residue_id)
    except Exception:
        return None
    doc = await _collection().find_one({"_id": _id})
    return _to_response(doc)


async def find_by_produtor_id(produtor_id: str, *, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
    cursor = _collection().find({"produtorId": produtor_id}).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return _to_response_many(docs)


async def find_by_categoria_id(categoria_id: str, *, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
    cursor = _collection().find({"categoriaId": categoria_id}).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return _to_response_many(docs)


async def list_residues(*, filters: Optional[Dict[str, Any]] = None, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
    query = filters or {}
    cursor = _collection().find(query).skip(skip).limit(limit).sort("dataCadastro", -1)
    docs = await cursor.to_list(length=limit)
    return _to_response_many(docs)


async def update_residue(residue_id: str, updates: Dict[str, Any]) -> bool:
    try:
        _id = ObjectId(residue_id)
    except Exception:
        return False
    if not updates:
        return True
    result = await _collection().update_one({"_id": _id}, {"$set": updates})
    return result.matched_count > 0


async def delete_residue(residue_id: str) -> bool:
    """
    Deleta resíduo (apenas se status permitir).
    Regra de negócio: Não pode deletar resíduos COLETADOS ou ENTREGUES.
    
    Args:
        residue_id: ID do resíduo
        
    Returns:
        bool: True se deletou com sucesso, False se não encontrou ou não pode deletar
    """
    try:
        _id = ObjectId(residue_id)
    except Exception:
        return False
    
    # Validar status antes de deletar
    residue = await find_by_id(residue_id)
    if not residue:
        return False
    
    status = residue.get("status", "DISPONIVEL")
    if status in ["COLETADO", "ENTREGUE"]:
        # Não permitir deletar resíduos já processados
        return False
    
    result = await _collection().delete_one({"_id": _id})
    return result.deleted_count > 0


# ============ MÉTODOS DE INTEGRAÇÃO COM HISTÓRICO ============

async def atualizar_status(
    residuo_id: str, 
    novo_status: str,
    usuario_id: str,
    detalhes: Optional[Dict[str, Any]] = None
) -> bool:
    """
    Atualiza status do resíduo e registra no histórico (Observer Pattern).
    
    Transições válidas:
    DISPONIVEL → AGENDADO → COLETADO → ENTREGUE
    Qualquer status → CANCELADO
    
    Args:
        residuo_id: ID do resíduo
        novo_status: Novo status (DISPONIVEL, AGENDADO, COLETADO, ENTREGUE, CANCELADO)
        usuario_id: Quem realizou a mudança
        detalhes: Informações adicionais
    
    Returns:
        bool: True se atualizou com sucesso
    """
    from datetime import datetime
    from src.infra.database.repositories import historico_repo
    
    # 1. Buscar resíduo atual
    residuo = await find_by_id(residuo_id)
    if not residuo:
        return False
    
    # 2. Atualizar status
    updates = {"status": novo_status}
    success = await update_residue(residuo_id, updates)
    if not success:
        return False
    
    # 3. Registrar no histórico (Observer Pattern)
    historico_doc = {
        "residuo_id": residuo_id,
        "acao": novo_status,
        "usuario_id": usuario_id,
        "data_acao": datetime.utcnow(),
        "detalhes": detalhes or {}
    }
    await historico_repo.criar_historico(historico_doc)
    
    return True


async def update_residue_with_history(
    residuo_id: str,
    updates: Dict[str, Any],
    usuario_id: str,
    acao: str,
    detalhes: Optional[Dict[str, Any]] = None
) -> bool:
    """
    Atualiza resíduo e registra mudança no histórico (Observer Pattern).
    Use este método quando precisar rastrear mudanças além de status.
    
    Args:
        residuo_id: ID do resíduo
        updates: Campos a atualizar
        usuario_id: Quem realizou a ação
        acao: Tipo de ação (CRIADO, AGENDADO, COLETADO, ENTREGUE)
        detalhes: Informações adicionais sobre a ação
    
    Returns:
        bool: True se atualizou com sucesso
    """
    from datetime import datetime
    from src.infra.database.repositories import historico_repo
    
    # 1. Atualizar resíduo
    success = await update_residue(residuo_id, updates)
    if not success:
        return False
    
    # 2. Registrar no histórico (Observer Pattern)
    historico_doc = {
        "residuo_id": residuo_id,
        "acao": acao,
        "usuario_id": usuario_id,
        "data_acao": datetime.utcnow(),
        "detalhes": detalhes or {}
    }
    await historico_repo.criar_historico(historico_doc)
    
    return True
