"""
Modelo de usuário
"""
from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId

from .base import PyObjectId


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
    role_id: str
    cidade_id: str
    estado_id: str

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }
