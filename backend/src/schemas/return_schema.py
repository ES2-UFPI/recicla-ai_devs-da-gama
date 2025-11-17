from pydantic import BaseModel, Field
from typing import Optional, List


class UserPublic(BaseModel):
	name: str = Field(..., description="Nome do usuário")
	email: str = Field(..., description="Email do usuário")
	role_id: str = Field(..., description="Papel do usuário")
	accepted_material: Optional[List[str]] = Field(None, description="Materiais aceitos pela receptora")
	inventory: Optional[List[str]] = Field(None, description="Inventário do coletor")
	phone: Optional[str] = Field(None, description="Telefone do usuário")
	addresses: Optional[List[dict]] = Field(None, description="Endereços do usuário")
