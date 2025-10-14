from pydantic import BaseModel, Field, field_validator
from typing import Optional
from bson import ObjectId
from datetime import datetime

#modelo da rota para criação de resíduos
class ResidueCreate(BaseModel):
    quantidade: float = Field(..., example=12.5)
    foto: Optional[str] = Field(None, example="http://example.com/foto.jpg")
    categoriaId: str = Field(..., example="categoria_id")
    produtorId: str = Field(..., example="produtor_id")

#modelo da rota para atualização de resíduos
class ResidueUpdate(BaseModel):
    quantidade: Optional[float] = Field(None, example=12.5)
    foto: Optional[str] = Field(None, example="http://example.com/foto.jpg")
    categoriaId: Optional[str] = Field(None, example="categoria_id")
    produtorId: Optional[str] = Field(None, example="produtor_id")

#modelo do banco de dados para resíduos
class ResidueInDB(BaseModel):
    id: str = Field(..., alias="_id", example="60c72b2f9b1d4c3a4c8e4d3e")
    quantidade: float = Field(..., example=12.5)
    dataCadastro: datetime = Field(default_factory=datetime.utcnow)
    foto: Optional[str] = None  # URL ou caminho da foto
    categoriaId: str
    produtorId: str