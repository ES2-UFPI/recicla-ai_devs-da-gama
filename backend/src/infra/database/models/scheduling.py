"""
Modelo de agendamento de coleta
"""
from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId

from .base import PyObjectId
from .enums import StatusAgendamento


class Scheduling(BaseModel):
    """
    Modelo de agendamento de coleta.
    Representa uma solicitação de coleta de resíduos por um produtor.
    """
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    produtorId: str = Field(..., description="Referência ao usuário produtor")
    residuosId: list[str] = Field(..., description="Lista de IDs dos resíduos a serem coletados")
    disponibilidade: list[str] = Field(..., description="Datas/horários disponíveis para coleta")
    local: str = Field(..., description="Endereço ou local de coleta")
    status: str = Field(default=StatusAgendamento.PENDENTE, description="Status do agendamento")
    observacoes: Optional[str] = Field(None, description="Observações adicionais sobre a coleta")
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "use_enum_values": True
    }
