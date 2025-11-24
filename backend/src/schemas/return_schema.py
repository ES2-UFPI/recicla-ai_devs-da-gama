from pydantic import BaseModel, Field
from typing import Optional


class UserPublic(BaseModel):
	name: str = Field(..., description="Nome do usuário")
	email: str = Field(..., description="Email do usuário")
	role_id: str = Field(..., description="Papel do usuário")


class ProdutorPublic(BaseModel):
	"""Schema público para dados do Produtor (apenas o próprio usuário via /auth/me)"""
	id: str = Field(..., description="ID do usuário")
	name: str = Field(..., description="Nome do produtor")
	email: str = Field(..., description="Email do produtor")
	role_id: str = Field(..., description="Papel do usuário (produtor)")
	telefone: Optional[str] = Field(None, description="Telefone do produtor")
	cidade_id: Optional[str] = Field(None, description="ID da cidade")
	estado_id: Optional[str] = Field(None, description="ID do estado")
	is_business: Optional[bool] = Field(None, description="Se é empresa")
	cnpj: Optional[str] = Field(None, description="CNPJ (se empresa)")
	points: Optional[int] = Field(0, description="Pontos acumulados")
	ranking: Optional[int] = Field(None, description="Posição no ranking")


class ColetorPublic(BaseModel):
	"""Schema público para dados do Coletor (apenas o próprio usuário via /auth/me)"""
	id: str = Field(..., description="ID do usuário")
	name: str = Field(..., description="Nome do coletor")
	email: str = Field(..., description="Email do coletor")
	role_id: str = Field(..., description="Papel do usuário (coletor)")
	telefone: Optional[str] = Field(None, description="Telefone do coletor")
	cidade_id: Optional[str] = Field(None, description="ID da cidade")
	estado_id: Optional[str] = Field(None, description="ID do estado")
	inventory: Optional[list] = Field(None, description="Inventário do coletor")


class ReceptorPublic(BaseModel):
	"""Schema público para dados do Receptor (apenas o próprio usuário via /auth/me)"""
	id: str = Field(..., description="ID do usuário")
	name: str = Field(..., description="Nome do receptor")
	email: str = Field(..., description="Email do receptor")
	role_id: str = Field(..., description="Papel do usuário (receptor)")
	telefone: Optional[str] = Field(None, description="Telefone do receptor")
	cidade_id: Optional[str] = Field(None, description="ID da cidade")
	estado_id: Optional[str] = Field(None, description="ID do estado")
	accepted_material: Optional[list] = Field(None, description="Materiais aceitos")
