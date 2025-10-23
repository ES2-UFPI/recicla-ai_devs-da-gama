"""
Modelo de categoria de resíduo
"""
from pydantic import BaseModel, Field
from typing import Optional, TYPE_CHECKING
from bson import ObjectId

from .base import PyObjectId
from .enums import StatusResiduo

if TYPE_CHECKING:
    from .residue import Residue


class CategoriaResiduo(BaseModel):
    """
    Modelo de categoria de resíduo.
    Define tipos de materiais recicláveis com preço de referência.
    Implementa Factory Method para criar resíduos vinculados.
    """
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    tipo: str = Field(..., description="Tipo da categoria (Plástico, Vidro, Papel, Metal, Eletrônico)")
    descricao: str = Field(..., description="Descrição detalhada da categoria")
    preco_por_kg: float = Field(..., gt=0, description="Preço de referência por kg")
    preco_por_unidade: Optional[float] = Field(None, gt=0, description="Preço de referência por unidade (opcional)")
    ativo: bool = Field(default=True, description="Status da categoria")

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "use_enum_values": True
    }
    
    def criar_residuo(
        self, 
        produtor_id: str, 
        quantidade: float,
        tipo_medida: str = "kg",
        foto: Optional[str] = None
    ) -> 'Residue':
        """
        Factory Method para criar resíduo vinculado a esta categoria.
        Calcula automaticamente o valor estimado baseado no preço da categoria.
        
        Args:
            produtor_id: ID do usuário produtor
            quantidade: Quantidade em kg ou unidades
            tipo_medida: Tipo de medida ("kg" ou "unidade")
            foto: URL opcional da foto do resíduo
            
        Returns:
            Residue: Novo resíduo com valor estimado calculado
        """
        # Import local para evitar import circular
        from .residue import Residue
        
        # Calcula valor baseado no tipo de medida
        if tipo_medida == "unidade":
            if self.preco_por_unidade is None:
                raise ValueError(f"Categoria '{self.tipo}' não possui preço por unidade configurado")
            valor_estimado = quantidade * self.preco_por_unidade
        else:  # kg (padrão)
            valor_estimado = quantidade * self.preco_por_kg
            
        return Residue(
            quantidade=quantidade,
            tipo_medida=tipo_medida,
            foto=foto,
            categoriaId=str(self.id),
            produtorId=produtor_id,
            valorEstimado=valor_estimado,
            status=StatusResiduo.DISPONIVEL
        )
