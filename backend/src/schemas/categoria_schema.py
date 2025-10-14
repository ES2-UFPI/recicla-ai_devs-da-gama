from pydantic import BaseModel, Field
from typing import Optional


class CategoriaResponseDTO(BaseModel):
    """
    DTO de resposta para categoria de resíduo.
    Usado para retornar dados de categoria ao cliente.
    """
    id: str = Field(..., description="ID da categoria")
    tipo: str = Field(..., description="Tipo da categoria (Plástico, Vidro, Papel, Metal, Eletrônico)")
    descricao: str = Field(..., description="Descrição detalhada")
    preco_por_kg: float = Field(..., description="Preço de referência por kg")
    ativo: bool = Field(..., description="Status da categoria")
    
    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": "60c72b2f9b1d4c3a4c8e4d3e",
                "tipo": "Plástico",
                "descricao": "Garrafas PET, sacolas plásticas, embalagens de produtos",
                "preco_por_kg": 2.50,
                "ativo": True
            }
        }


class CategoriaCreateDTO(BaseModel):
    """
    DTO de entrada para criar nova categoria.
    Usado por administradores para adicionar novos tipos de resíduos.
    """
    tipo: str = Field(
        ..., 
        min_length=3, 
        max_length=50, 
        description="Nome do tipo de resíduo"
    )
    descricao: str = Field(
        ..., 
        min_length=10, 
        max_length=500,
        description="Descrição detalhada do que se enquadra nesta categoria"
    )
    preco_por_kg: float = Field(
        ..., 
        gt=0, 
        description="Preço de referência por kg em reais"
    )
    ativo: bool = Field(
        default=True, 
        description="Define se a categoria está ativa"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "tipo": "Plástico",
                "descricao": "Garrafas PET, sacolas plásticas, embalagens de produtos de limpeza e alimentos",
                "preco_por_kg": 2.50,
                "ativo": True
            }
        }


class CategoriaUpdateDTO(BaseModel):
    """
    DTO de entrada para atualizar categoria existente.
    Todos os campos são opcionais.
    """
    tipo: Optional[str] = Field(
        None, 
        min_length=3, 
        max_length=50,
        description="Nome do tipo de resíduo"
    )
    descricao: Optional[str] = Field(
        None, 
        min_length=10, 
        max_length=500,
        description="Descrição detalhada"
    )
    preco_por_kg: Optional[float] = Field(
        None, 
        gt=0,
        description="Preço de referência por kg"
    )
    ativo: Optional[bool] = Field(
        None,
        description="Status da categoria"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "preco_por_kg": 3.00,
                "descricao": "Descrição atualizada com mais detalhes"
            }
        }


class CategoriaListResponseDTO(BaseModel):
    """
    DTO de resposta para listagem de categorias.
    Versão simplificada para uso em listas/dropdowns.
    """
    id: str
    tipo: str
    preco_por_kg: float
    
    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": "60c72b2f9b1d4c3a4c8e4d3e",
                "tipo": "Plástico",
                "preco_por_kg": 2.50
            }
        }
