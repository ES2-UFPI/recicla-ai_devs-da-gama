from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

from backend.src.infra.database.models.enums import EstadoColeta

class ColetaCreateSchema(BaseModel):
    agendamento_id: str = Field(..., description="Referência ao agendamento associado")
    produtor_id: str = Field(..., description="Referência ao produtor")
    coletor_id: str = Field(..., description="Referência ao coletor")
    resíduos_id: list[str] = Field(..., description="Lista de IDs dos resíduos coletados")
    data_hora: datetime = Field(..., description="Data e hora de início da coleta")
    local: dict = Field(..., description="Local da coleta")
    observacoes: Optional[str] = Field(None, description="Observações adicionais sobre a coleta")
    estado: str = Field(default=EstadoColeta.PENDENTE, description="Estado atual da coleta")

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, estado):
        if estado not in EstadoColeta.__members__.values():
            raise ValueError(f"Estado inválido: {estado}")
        return estado
    
    class Config:
        schema_extra = {
            "example": {
                "agendamento_id": "60c72b2f9b1d4c3a4c8e4d3e",
                "produtor_id": "60c72b2f9b1d4c3a4c8e4d3f",
                "coletor_id": "60c72b2f9b1d4c3a4c8e4d40",
                "resíduos_id": ["60c72b2f9b1d4c3a4c8e4d41", "60c72b2f9b1d4c3a4c8e4d42"],
                "data_hora": "2024-07-01T10:00:00Z",
                "local": "Rua Exemplo, 123, Cidade, Estado",
                "observacoes": "Deixar os resíduos na porta.",
                "estado": "PENDENTE"
            }
        }

class ColetaUpdateSchema(BaseModel):
    local: Optional[dict] = Field(None, description="Local da coleta")
    observacoes: Optional[str] = Field(None, description="Observações adicionais sobre a coleta")
    estado: Optional[str] = Field(None, description="Estado atual da coleta")

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, estado):
        if estado is not None and estado not in EstadoColeta.__members__.values():
            raise ValueError(f"Estado inválido: {estado}")
        return estado
    
    class Config:
        schema_extra = {
            "example": {
                "local": "Rua Atualizada, 456, Cidade, Estado",
                "observacoes": "Coleta realizada com sucesso.",
                "estado": "CONCLUIDA"
            }
        }

class ColetaInDBSchema(ColetaCreateSchema):
    """
        Esquema de retorno da coleta armazenada no banco de dados.
        (extendida de ColetaCreateSchema)
    """
    id: str = Field(..., description="ID único da coleta")

    class Config:
        schema_extra = {
            "example": {
                "id": "60c72b2f9b1d4c3a4c8e4d43",
                "agendamento_id": "60c72b2f9b1d4c3a4c8e4d3e",
                "produtor_id": "60c72b2f9b1d4c3a4c8e4d3f",
                "coletor_id": "60c72b2f9b1d4c3a4c8e4d40",
                "residuos_id": ["60c72b2f9b1d4c3a4c8e4d41", "60c72b2f9b1d4c3a4c8e4d42"],
                "data_hora": "2024-07-01T10:00:00Z",
                "local": {"endereco": "Rua Exemplo, 123, Cidade, Estado"},
                "observacoes": "Deixar os resíduos na porta.",
                "estado": "PENDENTE"
            }
        }