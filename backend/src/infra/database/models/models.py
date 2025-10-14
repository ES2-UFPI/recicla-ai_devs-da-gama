from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class User(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    email: str
    phone: str
    password_hash: str
    role_id: str
    cidade_id: str
    estado_id: str

    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}

class Residue(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    quantidade: float
    dataCadastro: datetime = Field(default_factory=datetime.utcnow)
    foto: Optional[str] = None  # URL ou caminho da foto
    categoriaId: str
    produtorId: str

    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}