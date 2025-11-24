from pydantic import BaseModel, Field
from typing import List


class CategoryQuantity(BaseModel):
    """Soma de quantidade por categoria e tipo de medida."""
    categoria: str = Field(..., description="Nome da categoria do resíduo")
    tipo_medida: str = Field(..., description="Tipo de medida: 'kg' ou 'unidade'")
    quantidade: float = Field(..., description="Quantidade total referente à categoria e tipo de medida")

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "categoria": "Plástico",
                "tipo_medida": "kg",
                "quantidade": 125.5
            }
        }
    }


class RelatorioByCategoryResponse(BaseModel):
    """Resposta do relatório agrupado por categoria."""
    by_category: List[CategoryQuantity] = Field(..., description="Lista de categorias com suas quantidades agregadas")

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "by_category": [
                    {"categoria": "Plástico", "tipo_medida": "kg", "quantidade": 125.5},
                    {"categoria": "Papel", "tipo_medida": "unidade", "quantidade": 42.0}
                ]
            }
        }
    }
