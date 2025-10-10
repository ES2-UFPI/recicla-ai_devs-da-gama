from pydantic import BaseModel, Field, field_validator
from typing import Optional
from bson import ObjectId

class UserCreate(BaseModel):
    name: str = Field(..., example="João Silva")
    email: str = Field(..., example="joao.silva@example.com")
    phone: str = Field(..., example="(99) 99999-9999")
    password: str = Field(..., example="senha123")
    role_id: str = Field(..., example="role_id")
    cidade_id: str = Field(..., example="cidade_id")
    estado_id: str = Field(..., example="estado_id")

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

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, example="João da Silva")
    email: Optional[str] = Field(None, example="novo.email@example.com")
    phone: Optional[str] = Field(None, example="(88) 88888-8888")
    password: Optional[str] = Field(None, example="novaSenha123")
    role_id: Optional[str] = Field(None, example="new_role_id")
    cidade_id: Optional[str] = Field(None, example="new_cidade_id")
    estado_id: Optional[str] = Field(None, example="new_estado_id")

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

class UserInDB(BaseModel):
    id: str = Field(..., alias="_id", example="60c72b2f9b1d4c3a4c8e4d3e")
    name: str = Field(..., example="João Silva")
    email: str = Field(..., example="joao.silva@example.com")  
    phone: str = Field(..., example="(99) 99999-9999")
    password_hash: str = Field(..., example="hashed_password")
    role_id: str = Field(..., example="role_id")
    cidade_id: str = Field(..., example="cidade_id")
    estado_id: str = Field(..., example="estado_id")