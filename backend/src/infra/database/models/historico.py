"""
Modelo de histórico de resíduo
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

from .base import PyObjectId


class HistoricoResiduo(BaseModel):
    """
    Modelo de histórico de resíduo.
    Implementa Observer Pattern: registra todas as mudanças de estado.
    Garante rastreabilidade completa do ciclo de vida.
    """
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    residuo_id: str = Field(..., description="Referência ao resíduo")
    acao: str = Field(..., description="Tipo de ação realizada")
    usuario_id: str = Field(..., description="Quem realizou a ação")
    data_acao: datetime = Field(default_factory=datetime.utcnow, description="Timestamp da ação")
    detalhes: Optional[dict] = Field(None, description="Dados adicionais em JSON (receptor_id, endereço, etc.)")
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "use_enum_values": True
    }
