from pydantic import BaseModel, Field


class UserPublic(BaseModel):
	name: str = Field(..., description="Nome do usuário")
	email: str = Field(..., description="Email do usuário")
	role_id: str = Field(..., description="Papel do usuário")
	addresses: list = Field([], description="Lista de endereços do usuário")
