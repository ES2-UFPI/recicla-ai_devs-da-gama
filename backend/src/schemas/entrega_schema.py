from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime


class EntregaCreate(BaseModel):
    """
    Schema para criação de uma entrega.
    Usado quando o coletor entrega resíduos para a receptora.
    """
    receptora_id: str = Field(
        ..., 
        description="ID da receptora (ecoponto) que receberá os resíduos",
        min_length=1
    )
    residuos_id: List[str] = Field(
        ..., 
        description="Lista de IDs dos resíduos a entregar",
        min_length=1
    )
    observacoes: Optional[str] = Field(
        None, 
        description="Observações sobre a entrega (opcional)"
    )
    
    @field_validator('residuos_id')
    @classmethod
    def validar_residuos_nao_vazio(cls, v):
        """Valida que a lista de resíduos não está vazia"""
        if not v or len(v) == 0:
            raise ValueError('Deve ter pelo menos um resíduo para entregar')
        return v


class EntregaResponse(BaseModel):
    """
    Schema de resposta de uma entrega.
    Retorna todos os dados da entrega incluindo campos gerados automaticamente.
    """
    id: str = Field(
        ..., 
        alias="_id",
        description="ID único da entrega"
    )
    data_hora: datetime = Field(
        ..., 
        description="Data e hora em que a entrega foi registrada"
    )
    receptora_id: str = Field(
        ..., 
        description="ID da receptora que recebeu os resíduos"
    )
    coletor_id: str = Field(
        ..., 
        description="ID do coletor que fez a entrega"
    )
    residuos_id: List[str] = Field(
        ..., 
        description="Lista de IDs dos resíduos entregues"
    )
    categorias_residuos_entregues: List[str] = Field(
        ..., 
        description="Lista das categorias dos resíduos entregues (ex: 'plastico', 'papel')"
    )
    observacoes: Optional[str] = Field(
        None, 
        description="Observações sobre a entrega"
    )
    
    model_config = {
        "populate_by_name": True,
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "data_hora": "2025-11-13T10:30:00",
                "receptora_id": "507f1f77bcf86cd799439012",
                "coletor_id": "507f1f77bcf86cd799439013",
                "residuos_id": ["res1", "res2"],
                "categorias_residuos_entregues": ["plastico", "papel"],
                "observacoes": "Entrega realizada com sucesso"
            }
        }
    }


class EntregaSumario(BaseModel):
    """
    Schema para sumarização de entregas por categoria.
    Usado para agregar estatísticas de entregas do coletor.
    """
    categoriaId: str = Field(
        ..., 
        description="ID da categoria do resíduo"
    )
    tipo_medida: str = Field(
        ..., 
        description="Tipo de medida (kg, unidade, litro, etc)"
    )
    quantidade_total: float = Field(
        ..., 
        description="Quantidade total entregue nesta categoria e tipo de medida",
        ge=0
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "categoriaId": "plastico",
                "tipo_medida": "kg",
                "quantidade_total": 150.5
            }
        }
    }