from pydantic import BaseModel, Field
from datetime import datetime


class ResgateCreate(BaseModel):
    """
    DTO para criar resgate (não usado diretamente via body).
    O recompensa_id virá da URL path parameter.
    """
    recompensa_id: str = Field(..., description="ID da recompensa a resgatar")
    # Nota: Mantido por consistência, mas endpoint usará path param


class ResgateResponse(BaseModel):
    """DTO de resposta SIMPLIFICADO para resgate."""
    id: str = Field(..., description="ID do resgate")
    recompensa_id: str = Field(..., description="ID da recompensa resgatada")
    produtor_id: str = Field(..., description="ID do produtor")
    pontos_gastos: int = Field(..., description="Pontos debitados")
    data_resgate: datetime = Field(..., description="Data/hora do resgate")
    
    class Config:
        from_attributes = True  # Pydantic v2 (era orm_mode)
        json_schema_extra = {
            "example": {
                "id": "60c72b2f9b1d4c3a4c8e4d40",
                "recompensa_id": "60c72b2f9b1d4c3a4c8e4d3e",
                "produtor_id": "60c72b2f9b1d4c3a4c8e4d3f",
                "pontos_gastos": 100,
                "data_resgate": "2025-11-19T14:30:00Z"
            }
        }
