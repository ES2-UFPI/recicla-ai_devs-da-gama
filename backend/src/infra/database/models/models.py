from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any
from datetime import datetime
from bson import ObjectId
from enum import Enum

# Enums para evitar strings mágicas
class StatusResiduo(str, Enum):
    """Estados possíveis de um resíduo no ciclo de vida"""
    DISPONIVEL = "DISPONIVEL"
    AGENDADO = "AGENDADO"
    COLETADO = "COLETADO"
    ENTREGUE = "ENTREGUE"
    CANCELADO = "CANCELADO"

class AcaoHistorico(str, Enum):
    """Ações que podem ser registradas no histórico"""
    CRIADO = "CRIADO"
    AGENDADO = "AGENDADO"
    COLETADO = "COLETADO"
    ENTREGUE = "ENTREGUE"
    CANCELADO = "CANCELADO"

# Pydantic v2 - Usar str diretamente para ObjectId
class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type: Any, _handler):
        from pydantic_core import core_schema
        
        def validate(value: Any) -> str:
            if isinstance(value, ObjectId):
                return str(value)
            if isinstance(value, str):
                if ObjectId.is_valid(value):
                    return value
                raise ValueError("Invalid ObjectId")
            raise ValueError("Invalid ObjectId type")
        
        return core_schema.no_info_plain_validator_function(
            validate,
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            )
        )

class User(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    email: str
    phone: str
    password_hash: str
    role_id: str
    cidade_id: str
    estado_id: str

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

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

class HistoricoResiduo(BaseModel):
    """
    Modelo de histórico de resíduo.
    Implementa Observer Pattern: registra todas as mudanças de estado.
    Garante rastreabilidade completa do ciclo de vida.
    """
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    residuo_id: str = Field(..., description="Referência ao resíduo")
    acao: str = Field(..., description="Tipo de ação realizada")
    usuario_id: str = Field(..., description="Quem realizou a ação")
    data_acao: datetime = Field(default_factory=datetime.utcnow, description="Timestamp da ação")
    detalhes: Optional[dict] = Field(None, description="Dados adicionais em JSON (receptor_id, endereço, etc.)")
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "use_enum_values": True
    }
