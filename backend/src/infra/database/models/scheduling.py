"""
Modelo de agendamento de coleta
"""
from pydantic import BaseModel, Field
from typing import Optional, Any
from bson import ObjectId

from .base import PyObjectId
from .enums import StatusAgendamento


class Scheduling(BaseModel):
    """
    Modelo de agendamento de coleta.
    Representa uma solicitação de coleta de resíduos por um produtor.
    
    A disponibilidade é armazenada como lista de dicts com estrutura:
    {
        "data": "dd/mm/aaaa",
        "hora_inicio": "hh:mm",
        "hora_fim": "hh:mm"
    }
    
    O local é armazenado como dict com dados completos do endereço:
    {
        "address_id": 1,
        "apelido": "Casa",
        "cep": "12345-678",
        "logradouro": "Rua Exemplo",
        "numero": "123",
        "complemento": "Apto 101",
        "latitude": "-5.0892",
        "longitude": "-42.8019"
    }
    """
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    produtorId: str = Field(..., description="Referência ao usuário produtor")
    residuosId: list[str] = Field(..., description="Lista de IDs dos resíduos a serem coletados")
    disponibilidade: list[dict[str, Any]] = Field(..., description="Lista de slots de disponibilidade (data, hora_inicio, hora_fim)")
    local: dict[str, Any] = Field(..., description="Endereço completo de coleta (snapshot do endereço do produtor)")
    status: str = Field(default=StatusAgendamento.PENDENTE, description="Status do agendamento")
    observacoes: Optional[str] = Field(None, description="Observações adicionais sobre a coleta")
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "use_enum_values": True
    }
