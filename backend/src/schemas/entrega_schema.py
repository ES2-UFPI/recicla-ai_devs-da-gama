from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime


class BuscarReceptorasRequest(BaseModel):
    """
    Schema para requisição de busca de receptoras próximas.
    Usado pelo coletor para encontrar receptoras em um raio específico.
    """
    latitude: float = Field(
        ...,
        description="Latitude da localização atual do coletor",
        ge=-90,
        le=90,
        example=-23.5505
    )
    longitude: float = Field(
        ...,
        description="Longitude da localização atual do coletor",
        ge=-180,
        le=180,
        example=-46.6333
    )
    raio: float = Field(
        ...,
        description="Raio de busca em quilômetros",
        gt=0,
        le=100,
        example=5.0
    )
    materiais_aceitos: Optional[List[str]] = Field(
        None,
        description="Filtrar receptoras que aceitem estes materiais (opcional)",
        example=["plástico", "papel"]
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "latitude": -23.5505,
                "longitude": -46.6333,
                "raio": 5.0,
                "materiais_aceitos": ["plástico", "papel"]
            }
        }
    }


class ReceptoraComDistancia(BaseModel):
    """
    Schema para resposta de receptora com distância calculada.
    Inclui informações da receptora e a distância até o coletor.
    """
    id: str = Field(
        ...,
        description="ID da receptora"
    )
    name: str = Field(
        ...,
        description="Nome da receptora"
    )
    email: str = Field(
        ...,
        description="Email de contato da receptora"
    )
    phone: str = Field(
        ...,
        description="Telefone de contato da receptora"
    )
    accepted_material: List[str] = Field(
        ...,
        description="Lista de materiais aceitos pela receptora"
    )
    addresses: Optional[List[dict]] = Field(
        None,
        description="Lista de endereços da receptora"
    )
    distancia_km: float = Field(
        ...,
        description="Distância em quilômetros do coletor até a receptora",
        ge=0
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "name": "Ecoponto Central",
                "email": "ecoponto@example.com",
                "phone": "(11) 98765-4321",
                "accepted_material": ["plástico", "papel", "metal"],
                "addresses": [
                    {
                        "id": 1,
                        "apelido": "Principal",
                        "cep": "12345-678",
                        "logradouro": "Rua Verde",
                        "numero": "100",
                        "latitude": "-23.5505",
                        "longitude": "-46.6333",
                        "complemento": "Galpão 2"
                    }
                ],
                "distancia_km": 2.5
            }
        }
    }


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

class ReceptoraInfo(BaseModel):
    """
    Schema completo de informações da receptora para a página de Realizar Entrega.
    Retorna todos os dados necessários incluindo materiais aceitos e contato.
    """
    id: str = Field(
        ...,
        description="ID da receptora"
    )
    name: str = Field(
        ...,
        description="Nome da receptora"
    )
    email: str = Field(
        ...,
        description="Email de contato da receptora"
    )
    phone: str = Field(
        ...,
        description="Telefone de contato da receptora"
    )
    accepted_material: List[str] = Field(
        ...,
        description="Lista de materiais aceitos pela receptora"
    )
    addresses: Optional[List[dict]] = Field(
        None,
        description="Lista de endereços da receptora"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "name": "Ecoponto Central",
                "email": "ecoponto@example.com",
                "phone": "(11) 98765-4321",
                "accepted_material": ["Plástico", "Papel", "Metal"],
                "addresses": [
                    {
                        "id": 1,
                        "apelido": "Principal",
                        "cep": "12345-678",
                        "logradouro": "Rua Verde",
                        "numero": "100",
                        "latitude": "-23.5505",
                        "longitude": "-46.6333",
                        "complemento": "Galpão 2"
                    }
                ]
            }
        }
    }