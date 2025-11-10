from pydantic import BaseModel, Field, field_validator
from typing import Optional
from bson import ObjectId

class Endereco(BaseModel):
    """
    Modelo de endereço associado ao usuário.
    """
    id: Optional[int] = Field(None, description="ID incremental do endereço (gerado automaticamente)")
    apelido: Optional[str] = Field(None, description="Apelido opcional do endereço, ex: 'Casa', 'Trabalho'")
    cep: str = Field(..., description="CEP do endereço, ex: '12345-678'")
    logradouro: str = Field(..., description="Logradouro do endereço, ex: 'Rua A'")
    numero: str = Field(..., description="Número do endereço, ex: '123'")
    latitude: str = Field(..., description="Latitude do endereço, ex: '-23.5505'")
    longitude: str = Field(..., description="Longitude do endereço, ex: '-46.6333'")
    complemento: Optional[str] = Field(None, description="Complemento do endereço, ex: 'Apto 101'")

class UserCreate(BaseModel):
    name: str = Field(..., example="João Silva")
    email: str = Field(..., example="joao.silva@example.com")
    phone: str = Field(..., example="(99) 99999-9999")
    password: str = Field(..., example="senha123")
    role_id: str = Field(..., example="role_id")
    addresses: Optional[list[Endereco]] = Field(None, example=[{
        "apelido": "Casa",
        "cep": "12345-678",
        "logradouro": "Rua A",
        "numero": "123",
        "latitude": "-23.5505",
        "longitude": "-46.6333",
        "complemento": "Apto 101"
    }])
    cidade_id: str = Field(..., example="cidade_id")
    estado_id: str = Field(..., example="estado_id")
    
    # Campos específicos de Produtor (opcionais)
    is_business: Optional[bool] = Field(None, example=False)
    cnpj: Optional[str] = Field(None, example="12.345.678/0001-90")
    points: Optional[int] = Field(None, example=0)
    ranking: Optional[int] = Field(None, example=0)
    
    # Campo específico de Coletor (opcional)
    inventory: Optional[list[str]] = Field(None, example=[])
    
    # Campo específico de Receptor (opcional)
    accepted_material: Optional[list[str]] = Field(None, example=["plástico", "papel"])

    # Email validations (format and normalization)
    @field_validator("email")
    def validate_email(cls, email: str):
        if not email or "@" not in email:
            raise ValueError("Email no formato incorreto")
        return email

    @field_validator("email")
    def normalize_email(cls, email: str):
        return email.strip().lower()

    # Password complexity validation
    @field_validator("password")
    def validate_password(cls, password: str):
        if len(password) < 8:
            raise ValueError("Senha deve ter no mínimo 8 caracteres.")
        if not any(char.isdigit() for char in password):
            raise ValueError("Senha deve ter no mínimo 1 número.")
        if not any(char.isupper() for char in password):
            raise ValueError("Senha deve ter no mínimo 1 letra maiúscula.")
        if not any(char in ["!", "@", "#", "$", "%", "&", "*"] for char in password):
            raise ValueError("Senha deve ter no mínimo 1 caractere especial.")
        return password

    @field_validator("addresses")
    def validate_addresses(cls, addresses: Optional[list[Endereco]]):
        if addresses is None:
            return addresses
        if not isinstance(addresses, list):
            raise ValueError("Addresses must be a list of Endereco instances.")

        for address in addresses:
            if address.cep[5] != '-':
                raise ValueError("CEP deve estar no formato '12345-678'.")
            if sum(ch.isdigit() for ch in address.cep) != 8:
                # contando apenas dígitos
                raise ValueError("CEP deve conter exatamente 8 dígitos numéricos.")
            if not isinstance(address, Endereco):
                raise ValueError("Each address must be an instance of Endereco.")
        
        return addresses

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, example="João da Silva")
    email: Optional[str] = Field(None, example="novo.email@example.com")
    phone: Optional[str] = Field(None, example="(88) 88888-8888")
    password: Optional[str] = Field(None, example="novaSenha123")
    addresses: Optional[list[Endereco]] = Field(None, example=[{
        "apelido": "Casa",
        "cep": "12345-678",
        "logradouro": "Rua A",
        "numero": "123",
        "latitude": "-23.5505",
        "longitude": "-46.6333",
        "complemento": "Apto 101"
    }])
    cidade_id: Optional[str] = Field(None, example="new_cidade_id")
    estado_id: Optional[str] = Field(None, example="new_estado_id")
    
    # Campos específicos de Produtor (opcionais)
    is_business: Optional[bool] = Field(None, example=False)
    cnpj: Optional[str] = Field(None, example="12.345.678/0001-90")
    points: Optional[int] = Field(None, example=0)
    ranking: Optional[int] = Field(None, example=0)
    
    # Campo específico de Coletor (opcional)
    inventory: Optional[list[str]] = Field(None, example=[])
    
    # Campo específico de Receptor (opcional)
    accepted_material: Optional[list[str]] = Field(None, example=["plástico", "papel"])

    @field_validator("email")
    def validate_email(cls, value: Optional[str]):
        if value is None:
            return value
        if not value or "@" not in value:
            raise ValueError("Email no formato incorreto")
        return value

    @field_validator("email")
    def normalize_email(cls, value: Optional[str]):
        if value is None:
            return value
        return value.strip().lower()

    @field_validator("password")
    def validate_password(cls, value: Optional[str]):
        if value is None:
            return value
        if len(value) < 8:
            raise ValueError("Senha deve ter no mínimo 8 caracteres.")
        if not any(char.isdigit() for char in value):
            raise ValueError("Senha deve ter no mínimo 1 número.")
        if not any(char.isupper() for char in value):
            raise ValueError("Senha deve ter no mínimo 1 letra maiúscula.")
        if not any(char in ["!", "@", "#", "$", "%", "&", "*"] for char in value):
            raise ValueError("Senha deve ter no mínimo 1 caractere especial.")
        return value
    
    @field_validator("addresses")
    def validate_addresses(cls, addresses: Optional[list[Endereco]]):
        if addresses is None:
            return addresses
        if not isinstance(addresses, list):
            raise ValueError("Addresses must be a list of Endereco instances.")

        for address in addresses:
            if address.cep[5] != '-':
                raise ValueError("CEP deve estar no formato '12345-678'.")
            if sum(ch.isdigit() for ch in address.cep) != 8:
                # contando apenas dígitos
                raise ValueError("CEP deve conter exatamente 8 dígitos numéricos.")
            if not isinstance(address, Endereco):
                raise ValueError("Each address must be an instance of Endereco.")
        
        return addresses

class UserInDB(BaseModel):
    id: str = Field(..., alias="_id", example="60c72b2f9b1d4c3a4c8e4d3e")
    name: str = Field(..., example="João Silva")
    email: str = Field(..., example="joao.silva@example.com")  
    phone: str = Field(..., example="(99) 99999-9999")
    password_hash: str = Field(..., example="hashed_password")
    role_id: str = Field(..., example="role_id")
    addresses: Optional[list[Endereco]] = Field(None, example=[{
        "apelido": "Casa",
        "cep": "12345-678",
        "logradouro": "Rua A",
        "numero": "123",
        "latitude": "-23.5505",
        "longitude": "-46.6333",
        "complemento": "Apto 101"
    }])
    cidade_id: str = Field(..., example="cidade_id")
    estado_id: str = Field(..., example="estado_id")