from pydantic import BaseModel, Field, field_validator
from typing import Optional

#modelo da rota para criação de agendamentos
class SchedulingCreate(BaseModel):
    produtorId: str = Field(..., example="produtor_id")
    residuosId: list[str] = Field(..., example=["residuo_id1", "residuo_id2"])
    disponibilidade: list[str] = Field(..., example=["2023-10-01T10:00", "2023-10-02T14:00"])
    local: str = Field(..., example="Rua Exemplo, 123, Cidade, Estado")
    observacoes: Optional[str] = Field(None, example="Deixar os resíduos na portaria.")

#modelo da rota para atualização de agendamentos
class SchedulingUpdate(BaseModel):
    produtorId: Optional[str] = Field(None, example="produtor_id")
    residuosId: Optional[list[str]] = Field(None, example=["residuo_id1", "residuo_id2"])
    disponibilidade: Optional[list[str]] = Field(None, example=["2023-10-01T10:00", "2023-10-02T14:00"])
    local: Optional[str] = Field(None, example="Rua Exemplo, 123, Cidade, Estado")
    observacoes: Optional[str] = Field(None, example="Deixar os resíduos na portaria.")

#modelo do banco de dados para agendamentos
class SchedulingInDB(BaseModel):
    id: str = Field(..., alias="_id", example="60c72b2f9b1d4c3a4c8e4d3e")
    produtorId: str
    residuosId: list[str]
    disponibilidade: list[str]
    local: str
    status: str
    observacoes: Optional[str] = None