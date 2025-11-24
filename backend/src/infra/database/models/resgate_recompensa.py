"""
Modelo SIMPLIFICADO de resgate de recompensa.
Rastreia histórico de trocas de pontos (apenas essencial).
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

from .base import PyObjectId


class ResgateRecompensa(BaseModel):
    """
    Registro de resgate de recompensa.
    
    Representa o histórico de trocas de pontos por recompensas.
    Mantém rastreabilidade simples sem campos desnecessários.
    """
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    
    # Referências
    recompensa_id: str = Field(..., description="ID da recompensa resgatada")
    produtor_id: str = Field(..., description="ID do produtor que resgatou")
    
    # Snapshot mínimo
    pontos_gastos: int = Field(..., gt=0, description="Pontos debitados no momento do resgate")
    
    # Rastreabilidade temporal
    data_resgate: datetime = Field(default_factory=datetime.utcnow, description="Timestamp do resgate")
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
    }
