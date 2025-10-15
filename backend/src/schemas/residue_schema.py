from pydantic import BaseModel, Field, field_validator
from typing import Optional
from bson import ObjectId
from datetime import datetime

# ============ DTOs DE ENTRADA ============

class ResidueCreate(BaseModel):
    """
    DTO para criação de resíduo.
    O produtorId virá automaticamente do JWT (usuário autenticado).
    """
    quantidade: float = Field(..., gt=0, description="Quantidade em kg ou unidades", example=12.5)
    tipo_medida: str = Field(default="kg", description="Tipo de medida: 'kg' ou 'unidade'", example="kg")
    foto: Optional[str] = Field(None, description="URL da foto do resíduo", example="http://example.com/foto.jpg")
    categoriaId: str = Field(..., description="ID da categoria do resíduo", example="60c72b2f9b1d4c3a4c8e4d3e")
    
    @field_validator('tipo_medida')
    @classmethod
    def validar_tipo_medida(cls, v):
        if v not in ["kg", "unidade"]:
            raise ValueError('tipo_medida deve ser "kg" ou "unidade"')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "quantidade": 10,
                "tipo_medida": "unidade",
                "foto": "http://example.com/garrafas.jpg",
                "categoriaId": "60c72b2f9b1d4c3a4c8e4d3e"
            }
        }


class ResidueUpdate(BaseModel):
    """
    DTO para atualização de resíduo.
    Todos os campos são opcionais.
    """
    quantidade: Optional[float] = Field(None, gt=0, description="Nova quantidade em kg ou unidades", example=15.0)
    tipo_medida: Optional[str] = Field(None, description="Novo tipo de medida: 'kg' ou 'unidade'", example="unidade")
    foto: Optional[str] = Field(None, description="Nova URL da foto", example="http://example.com/foto2.jpg")
    categoriaId: Optional[str] = Field(None, description="Novo ID da categoria", example="60c72b2f9b1d4c3a4c8e4d3e")
    
    @field_validator('tipo_medida')
    @classmethod
    def validar_tipo_medida(cls, v):
        if v is not None and v not in ["kg", "unidade"]:
            raise ValueError('tipo_medida deve ser "kg" ou "unidade"')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "quantidade": 15.0,
                "tipo_medida": "unidade",
                "foto": "http://example.com/foto_atualizada.jpg"
            }
        }


# ============ DTOs DE RESPOSTA ============

class ResidueResponse(BaseModel):
    """
    DTO de resposta completo para resíduo.
    Inclui todos os dados, incluindo valor estimado e status.
    """
    id: str = Field(..., description="ID do resíduo")
    produtorId: str = Field(..., description="ID do produtor")
    categoriaId: str = Field(..., description="ID da categoria")
    quantidade: float = Field(..., description="Quantidade em kg ou unidades")
    tipo_medida: str = Field(..., description="Tipo de medida: 'kg' ou 'unidade'")
    foto: Optional[str] = Field(None, description="URL da foto")
    valorEstimado: float = Field(..., description="Valor estimado calculado")
    status: str = Field(..., description="Status atual (DISPONIVEL, AGENDADO, COLETADO, ENTREGUE)")
    dataCadastro: datetime = Field(..., description="Data de criação")
    
    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": "60c72b2f9b1d4c3a4c8e4d3e",
                "produtorId": "60c72b2f9b1d4c3a4c8e4d3a",
                "categoriaId": "60c72b2f9b1d4c3a4c8e4d3b",
                "quantidade": 10,
                "tipo_medida": "unidade",
                "foto": "http://example.com/garrafas.jpg",
                "valorEstimado": 1.50,
                "status": "DISPONIVEL",
                "dataCadastro": "2025-10-14T10:30:00Z"
            }
        }


class ResidueListResponse(BaseModel):
    """
    DTO de resposta simplificado para listagens.
    Usado em listas para economizar banda.
    """
    id: str
    quantidade: float
    categoriaId: str
    valorEstimado: float
    status: str
    dataCadastro: datetime
    
    class Config:
        orm_mode = True


class HistoricoResiduoResponse(BaseModel):
    """
    DTO de resposta para histórico do resíduo.
    Exibe a linha do tempo completa de ações.
    """
    id: str = Field(..., description="ID do registro de histórico")
    residuo_id: str = Field(..., description="ID do resíduo")
    acao: str = Field(..., description="Tipo de ação (CRIADO, AGENDADO, COLETADO, ENTREGUE)")
    usuario_id: str = Field(..., description="ID do usuário que realizou a ação")
    data_acao: datetime = Field(..., description="Timestamp da ação")
    detalhes: Optional[dict] = Field(None, description="Informações adicionais sobre a ação")
    
    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": "60c72b2f9b1d4c3a4c8e4d3f",
                "residuo_id": "60c72b2f9b1d4c3a4c8e4d3e",
                "acao": "CRIADO",
                "usuario_id": "60c72b2f9b1d4c3a4c8e4d3a",
                "data_acao": "2025-10-14T10:30:00Z",
                "detalhes": {
                    "quantidade": 12.5,
                    "categoria": "Plástico"
                }
            }
        }


class ResidueStatusUpdate(BaseModel):
    """
    DTO específico para atualização de status.
    Usado pelo módulo de Logística.
    """
    novo_status: str = Field(
        ..., 
        description="Novo status (DISPONIVEL, AGENDADO, COLETADO, ENTREGUE, CANCELADO)",
        example="AGENDADO"
    )
    detalhes: Optional[dict] = Field(
        None,
        description="Informações adicionais sobre a mudança de status",
        example={"coletor_id": "123", "data_agendamento": "2025-10-15"}
    )
    
    class Config:
        schema_extra = {
            "example": {
                "novo_status": "AGENDADO",
                "detalhes": {
                    "coletor_id": "60c72b2f9b1d4c3a4c8e4d3c",
                    "data_agendamento": "2025-10-15T14:00:00Z"
                }
            }
        }


# ============ DTO LEGADO (mantido para compatibilidade) ============

class ResidueInDB(BaseModel):
    """
    DTO legado para compatibilidade.
    Use ResidueResponse para novos desenvolvimentos.
    """
    id: str = Field(..., alias="_id", example="60c72b2f9b1d4c3a4c8e4d3e")
    quantidade: float = Field(..., example=12.5)
    dataCadastro: datetime = Field(default_factory=datetime.utcnow)
    foto: Optional[str] = None
    categoriaId: str
    produtorId: str