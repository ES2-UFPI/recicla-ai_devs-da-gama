from pydantic import BaseModel, Field
from typing import Optional, TYPE_CHECKING
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

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class User(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    email: str
    phone: str
    password_hash: str
    role_id: str
    cidade_id: str
    estado_id: str

    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}

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
    ativo: bool = Field(default=True, description="Status da categoria")

    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}
        use_enum_values = True
    
    def criar_residuo(
        self, 
        produtor_id: str, 
        quantidade: float, 
        foto: Optional[str] = None
    ) -> 'Residue':
        """
        Factory Method para criar resíduo vinculado a esta categoria.
        Calcula automaticamente o valor estimado baseado no preço da categoria.
        
        Args:
            produtor_id: ID do usuário produtor
            quantidade: Quantidade em kg
            foto: URL opcional da foto do resíduo
            
        Returns:
            Residue: Novo resíduo com valor estimado calculado
        """
        return Residue(
            quantidade=quantidade,
            foto=foto,
            categoriaId=str(self.id),
            produtorId=produtor_id,
            valorEstimado=quantidade * self.preco_por_kg,
            status=StatusResiduo.DISPONIVEL
        )

class Residue(BaseModel):
    """
    Modelo de resíduo reciclável.
    Representa um lote de material cadastrado por um produtor.
    """
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    quantidade: float = Field(..., gt=0, description="Quantidade em kg")
    dataCadastro: datetime = Field(default_factory=datetime.utcnow)
    foto: Optional[str] = Field(None, description="URL ou caminho da foto")
    categoriaId: str = Field(..., description="Referência à categoria")
    produtorId: str = Field(..., description="Referência ao usuário produtor")
    valorEstimado: float = Field(default=0.0, description="Valor calculado (quantidade × preço categoria)")
    status: str = Field(default=StatusResiduo.DISPONIVEL, description="Estado atual do resíduo")

    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}
        use_enum_values = True
    
    def calcular_valor_estimado(self, preco_categoria: float) -> float:
        """
        Calcula e atualiza o valor estimado do resíduo.
        
        Args:
            preco_categoria: Preço por kg da categoria
            
        Returns:
            float: Valor estimado calculado
        """
        self.valorEstimado = self.quantidade * preco_categoria
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
    
    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}
        use_enum_values = True