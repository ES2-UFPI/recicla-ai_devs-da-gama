"""
Modelo de usuário
"""
from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId

from .base import PyObjectId


class Endereco(BaseModel):
    """
    Modelo de endereço associado ao usuário.
    """
    id: int = Field(..., description="ID incremental do endereço, ex: 1, 2, 3")
    apelido: Optional[str] = Field(None, description="Apelido opcional do endereço, ex: 'Casa', 'Trabalho'")
    cep: str = Field(..., description="CEP do endereço, ex: '12345-678'")
    logradouro: str = Field(..., description="Logradouro do endereço, ex: 'Rua A'")
    numero: str = Field(..., description="Número do endereço, ex: '123'")
    latitude: str = Field(..., description="Latitude do endereço, ex: '-23.5505'")
    longitude: str = Field(..., description="Longitude do endereço, ex: '-46.6333'")
    complemento: Optional[str] = Field(None, description="Complemento do endereço, ex: 'Apto 101'")

class User(BaseModel):
    """
    Modelo de usuário do sistema.
    Representa produtores, coletores e outros roles.
    """
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    email: str
    phone: str
    password_hash: str
    addresses: list[Endereco]
    role_id: str
    cidade_id: str
    estado_id: str

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }
