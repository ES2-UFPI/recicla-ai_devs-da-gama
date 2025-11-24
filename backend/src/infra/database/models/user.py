"""
Modelo de usuário
Adaptado para seguir a arquitetura de User Builders (produtor, coletor, receptor)
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
    Representa produtores, coletores e receptores com seus campos específicos.
    
    Campos Comuns (todos os roles):
    - id, name, email, phone, password_hash, addresses, role_id, cidade_id, estado_id
    
    Campos Específicos por Role:
    
    🏭 PRODUTOR (role_id="produtor"):
    - is_business: bool - Se é empresa (True) ou pessoa física (False)
    - cnpj: Optional[str] - CNPJ (obrigatório se is_business=True)
    - points: int - Pontos de gamificação (padrão: 0)
    - ranking: int - Posição no ranking (padrão: 0)
    
    🚛 COLETOR (role_id="coletor"):
    - inventory: list[str] - Lista de IDs de resíduos coletados/em estoque
    
    📍 RECEPTOR (role_id="receptor"):
    - accepted_material: list[str] - Tipos de materiais/resíduos aceitos
    """
    
    # ===== CAMPOS COMUNS (todos os roles) =====
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str = Field(..., description="Nome do usuário")
    email: str = Field(..., description="Email único do usuário")
    phone: str = Field(..., description="Telefone de contato")
    password_hash: str = Field(..., description="Hash da senha (bcrypt_sha256)")
    addresses: list[Endereco] = Field(default_factory=list, description="Lista de endereços")
    role_id: str = Field(..., description="Tipo de usuário: 'produtor', 'coletor' ou 'receptor'")
    cidade_id: str = Field(..., description="ID da cidade")
    estado_id: str = Field(..., description="ID do estado")
    
    # ===== CAMPOS ESPECÍFICOS DE PRODUTOR =====
    is_business: Optional[bool] = Field(
        None, 
        description="[PRODUTOR] Se True: empresa (requer CNPJ); Se False: pessoa física"
    )
    cnpj: Optional[str] = Field(
        None, 
        description="[PRODUTOR] CNPJ da empresa (obrigatório se is_business=True)"
    )
    points: Optional[int] = Field(
        None, 
        description="[PRODUTOR] Pontos de gamificação (padrão: 0)"
    )
    ranking: Optional[int] = Field(
        None, 
        description="[PRODUTOR] Posição no ranking (padrão: 0)"
    )
    
    # ===== CAMPOS ESPECÍFICOS DE COLETOR =====
    inventory: Optional[list[str]] = Field(
        None, 
        description="[COLETOR] Lista de IDs de resíduos coletados/em estoque"
    )
    
    # ===== CAMPOS ESPECÍFICOS DE RECEPTOR =====
    accepted_material: Optional[list[str]] = Field(
        None, 
        description="[RECEPTOR] Tipos de materiais/resíduos aceitos no ponto de coleta"
    )

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }
