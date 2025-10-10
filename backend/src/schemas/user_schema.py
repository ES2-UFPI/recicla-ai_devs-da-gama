from pydantic import BaseModel, Field
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

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, example="João da Silva")
    email: Optional[str] = Field(None, example="novo.email@example.com")
    phone: Optional[str] = Field(None, example="(88) 88888-8888")
    password: Optional[str] = Field(None, example="novaSenha123")
    role_id: Optional[str] = Field(None, example="new_role_id")
    cidade_id: Optional[str] = Field(None, example="new_cidade_id")
    estado_id: Optional[str] = Field(None, example="new_estado_id")

class UserInDB(BaseModel):
    id: str = Field(..., alias="_id", example="60c72b2f9b1d4c3a4c8e4d3e")
    name: str = Field(..., example="João Silva")
    email: str = Field(..., example="joao.silva@example.com")  
    phone: str = Field(..., example="(99) 99999-9999")
    password_hash: str = Field(..., example="hashed_password")
    role_id: str = Field(..., example="role_id")
    cidade_id: str = Field(..., example="cidade_id")
    estado_id: str = Field(..., example="estado_id")