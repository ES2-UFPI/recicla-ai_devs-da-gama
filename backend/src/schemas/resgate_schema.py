"""
Schemas para operações de Resgate de Recompensa
Define DTOs de saída (response) para histórico de resgates
"""
from pydantic import BaseModel, Field
from datetime import datetime


class ResgateResponse(BaseModel):
    """
    DTO de resposta para resgate de recompensa.
    Usado para retornar dados de um resgate concluído.
    """
    id: str = Field(..., description="ID único do resgate")
    recompensa_id: str = Field(..., description="ID da recompensa resgatada")
    produtor_id: str = Field(..., description="ID do produtor que resgatou")
    pontos_gastos: int = Field(..., gt=0, description="Pontos debitados no resgate")
    data_resgate: datetime = Field(..., description="Data e hora do resgate")
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "60c72b2f9b1d4c3a4c8e4d40",
                "recompensa_id": "60c72b2f9b1d4c3a4c8e4d3e",
                "produtor_id": "60c72b2f9b1d4c3a4c8e4d3f",
                "pontos_gastos": 500,
                "data_resgate": "2025-11-19T14:30:00Z"
            }
        }
    }
