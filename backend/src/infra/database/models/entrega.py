"""
Modelo de coleta
"""
from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime
from bson import ObjectId

from .base import PyObjectId

class Entrega(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    data_hora: datetime = Field(..., description="Data e hora da entrega")
    receptora_id: str = Field(..., description="Referência à receptora")
    coletor_id: str = Field(..., description="Referência ao coletor")
    residuos_id: list[str] = Field(..., description="Lista de IDs dos resíduos entregues")
    categorias_residuos_entregues: list[str] = Field(..., description="Categorias dos resíduos entregues")
    observacoes: Optional[str] = Field(None, description="Observações adicionais sobre a entrega")
   

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "use_enum_values": True
    }

    