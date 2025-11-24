"""
Schemas para operações de Recompensa
Define DTOs de entrada (create/update) e saída (response) para o sistema de recompensas
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


# ============ DTOs DE ENTRADA ============

class RecompensaCreate(BaseModel):
    """
    DTO para criação de recompensa.
    Usado por administradores para cadastrar novas recompensas no sistema.
    """
    nome: str = Field(
        ..., 
        min_length=3, 
        max_length=100,
        description="Nome da recompensa",
        example="Vale-compra R$ 50,00"
    )
    tipo: str = Field(
        ..., 
        description="Tipo da recompensa: 'produto', 'desconto', 'voucher', 'cupom'",
        example="voucher"
    )
    descricao: str = Field(
        ..., 
        min_length=10, 
        max_length=500,
        description="Descrição detalhada da recompensa",
        example="Vale-compra de R$ 50,00 para ser usado em lojas parceiras"
    )
    pontos_necessarios: int = Field(
        ..., 
        gt=0,
        description="Quantidade de pontos necessários para resgate",
        example=500
    )
    foto_url: Optional[str] = Field(
        None,
        description="URL da foto da recompensa",
        example="https://example.com/recompensa.jpg"
    )
    estoque: Optional[int] = Field(
        default=999,
        ge=0,
        description="Quantidade disponível em estoque",
        example=100
    )
    parceiro: Optional[str] = Field(
        None,
        max_length=100,
        description="Nome do parceiro/patrocinador da recompensa",
        example="Supermercado Verde"
    )
    ativo: bool = Field(
        default=True,
        description="Se a recompensa está ativa e disponível para resgate"
    )
    
    @field_validator('tipo')
    @classmethod
    def validar_tipo(cls, v):
        tipos_validos = ['produto', 'desconto', 'voucher', 'cupom']
        if v.lower() not in tipos_validos:
            raise ValueError(f'tipo deve ser um dos seguintes: {", ".join(tipos_validos)}')
        return v.lower()
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "nome": "Vale-compra R$ 50,00",
                "tipo": "voucher",
                "descricao": "Vale-compra de R$ 50,00 para ser usado em lojas parceiras",
                "pontos_necessarios": 500,
                "foto_url": "https://example.com/vale50.jpg",
                "estoque": 100,
                "parceiro": "Supermercado Verde",
                "ativo": True
            }
        }
    }


class RecompensaUpdate(BaseModel):
    """
    DTO para atualização de recompensa.
    Todos os campos são opcionais.
    """
    nome: Optional[str] = Field(
        None,
        min_length=3,
        max_length=100,
        description="Novo nome da recompensa"
    )
    tipo: Optional[str] = Field(
        None,
        description="Novo tipo da recompensa"
    )
    descricao: Optional[str] = Field(
        None,
        min_length=10,
        max_length=500,
        description="Nova descrição da recompensa"
    )
    pontos_necessarios: Optional[int] = Field(
        None,
        gt=0,
        description="Nova quantidade de pontos necessários"
    )
    foto_url: Optional[str] = Field(
        None,
        description="Nova URL da foto"
    )
    estoque: Optional[int] = Field(
        None,
        ge=0,
        description="Novo estoque disponível"
    )
    parceiro: Optional[str] = Field(
        None,
        max_length=100,
        description="Novo nome do parceiro"
    )
    ativo: Optional[bool] = Field(
        None,
        description="Novo status de ativação"
    )
    
    @field_validator('tipo')
    @classmethod
    def validar_tipo(cls, v):
        if v is not None:
            tipos_validos = ['produto', 'desconto', 'voucher', 'cupom']
            if v.lower() not in tipos_validos:
                raise ValueError(f'tipo deve ser um dos seguintes: {", ".join(tipos_validos)}')
            return v.lower()
        return v
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "estoque": 50,
                "ativo": True
            }
        }
    }


# ============ DTOs DE RESPOSTA ============

class RecompensaResponse(BaseModel):
    """
    DTO de resposta completo para recompensa.
    Inclui todos os dados, incluindo informações de cadastro.
    """
    id: str = Field(..., description="ID da recompensa")
    nome: str = Field(..., description="Nome da recompensa")
    tipo: str = Field(..., description="Tipo da recompensa")
    descricao: str = Field(..., description="Descrição detalhada")
    pontos_necessarios: int = Field(..., description="Pontos necessários para resgate")
    foto_url: Optional[str] = Field(None, description="URL da foto")
    estoque: int = Field(..., description="Quantidade disponível em estoque")
    parceiro: Optional[str] = Field(None, description="Nome do parceiro/patrocinador")
    data_cadastro: datetime = Field(..., description="Data de cadastro da recompensa")
    ativo: bool = Field(..., description="Se a recompensa está ativa e disponível para resgate")
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "60c72b2f9b1d4c3a4c8e4d3e",
                "nome": "Vale-compra R$ 50,00",
                "tipo": "voucher",
                "descricao": "Vale-compra de R$ 50,00 para ser usado em lojas parceiras",
                "pontos_necessarios": 500,
                "foto_url": "https://example.com/vale50.jpg",
                "estoque": 100,
                "parceiro": "Supermercado Verde",
                "data_cadastro": "2025-11-18T10:30:00Z",
                "ativo": True
            }
        }
    }