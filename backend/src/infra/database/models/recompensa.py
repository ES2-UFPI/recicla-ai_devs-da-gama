"""
Modelo de Recompensa
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

from .base import PyObjectId


class Recompensa(BaseModel):
    """
    Modelo de recompensa do sistema de gamificação.
    Representa prêmios que podem ser resgatados por produtores usando pontos.
    """
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    nome: str = Field(..., description="Nome da recompensa")
    tipo: str = Field(..., description="Tipo da recompensa: 'produto', 'desconto', 'voucher', 'cupom'")
    descricao: str = Field(..., description="Descrição detalhada da recompensa")
    pontos_necessarios: int = Field(..., gt=0, description="Quantidade de pontos necessários para resgate")
    foto_url: Optional[str] = Field(None, description="URL da foto da recompensa")
    estoque: Optional[int] = Field(default=999, ge=0, description="Quantidade disponível em estoque") # Default alto para produção
    parceiro: Optional[str] = Field(None, description="Nome do parceiro/patrocinador da recompensa")
    data_cadastro: datetime = Field(default_factory=datetime.utcnow, description="Data de cadastro da recompensa")
    ativo: bool = Field(default=True, description="Se a recompensa está ativa e disponível para resgate")

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "use_enum_values": True
    }