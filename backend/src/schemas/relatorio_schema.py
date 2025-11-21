from pydantic import BaseModel, Field
from typing import List


class CategoryQuantity(BaseModel):
    """Soma de quantidade por categoria."""
    categoria: str = Field(..., description="Nome da categoria do resíduo")
    quantidade: float = Field(..., description="Quantidade total (kg ou unidades) referente à categoria")

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "categoria": "Plástico",
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
                    {"categoria": "Plástico", "quantidade": 125.5},
                    {"categoria": "Papel", "quantidade": 42.0}
                ]
            }
        }
    }
