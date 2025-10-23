"""
Modelo de resíduo
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

from .base import PyObjectId
from .enums import StatusResiduo


class Residue(BaseModel):
    """
    Modelo de resíduo reciclável.
    Representa um lote de material cadastrado por um produtor.
    """
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    quantidade: float = Field(..., gt=0, description="Quantidade em kg ou unidades")
    tipo_medida: str = Field(default="kg", description="Tipo de medida: 'kg' ou 'unidade'")
    dataCadastro: datetime = Field(default_factory=datetime.utcnow)
    foto: Optional[str] = Field(None, description="URL ou caminho da foto")
    categoriaId: str = Field(..., description="Referência à categoria")
    produtorId: str = Field(..., description="Referência ao usuário produtor")
    valorEstimado: float = Field(default=0.0, description="Valor calculado baseado na medida")
    status: str = Field(default=StatusResiduo.DISPONIVEL, description="Estado atual do resíduo")

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "use_enum_values": True
    }
    
    def calcular_valor_estimado(self, preco_por_kg: float, preco_por_unidade: Optional[float] = None) -> float:
        """
        Calcula e atualiza o valor estimado do resíduo.
        
        Args:
            preco_por_kg: Preço por kg da categoria
            preco_por_unidade: Preço por unidade da categoria (opcional)
            
        Returns:
            float: Valor estimado calculado
            
        Raises:
            ValueError: Se tipo_medida for "unidade" mas preco_por_unidade não foi fornecido
        """
        if self.tipo_medida == "unidade":
            if preco_por_unidade is None:
                raise ValueError("Preço por unidade não fornecido para cálculo")
            self.valorEstimado = self.quantidade * preco_por_unidade
        else:  # kg (padrão)
            self.valorEstimado = self.quantidade * preco_por_kg
        return self.valorEstimado
