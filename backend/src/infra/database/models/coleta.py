"""
Modelo de coleta
"""
from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime
from bson import ObjectId

from .base import PyObjectId
from .enums import EstadoColeta

class Coleta(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    agendamento_id: str = Field(..., description="Referência ao agendamento associado")
    produtor_id: str = Field(..., description="Referência ao produtor")
    coletor_id: str = Field(..., description="Referência ao coletor")
    residuos_id: list[str] = Field(..., description="Lista de IDs dos resíduos coletados")
    data_hora: datetime = Field(..., description="Data e hora de início da coleta")
    local: dict = Field(..., description="Local da coleta")
    observacoes: Optional[str] = Field(None, description="Observações adicionais sobre a coleta")
    estado: str = Field(default=EstadoColeta.PENDENTE, description="Estado atual da coleta")

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "use_enum_values": True
    }

    def marcar_como_concluida(self):
        """
        Marca a coleta como concluída, definindo a data e hora de fim.
        """
        self.estado = EstadoColeta.CONCLUIDA

    def adicionar_observacao(self, observacao: str):
        """
        Adiciona uma observação à coleta.
        
        Args:
            observacao: Texto da observação a ser adicionada
        """
        if self.observacoes:
            self.observacoes += f"\n{observacao}"
        else:
            self.observacoes = observacao
