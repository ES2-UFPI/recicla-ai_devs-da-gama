"""
Schemas (DTOs) para autenticação e gestão de tokens.
Define os contratos de entrada e saída dos endpoints de auth.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional


class LoginRequest(BaseModel):
	"""
	Schema para requisição de login.
	Permite login por e-mail OU telefone.
	"""
	credential: str = Field(
		..., 
		example="joao.silva@example.com",
		description="E-mail ou telefone do usuário"
	)
	password: str = Field(
		..., 
		example="senha123",
		description="Senha do usuário"
	)
	
	@field_validator("credential")
	def validate_credential(cls, value: str):
		if not value or len(value.strip()) == 0:
			raise ValueError("Credencial não pode estar vazia")
		return value.strip()


class LoginResponse(BaseModel):
	"""
	Schema para resposta de login bem-sucedido.
	Tokens são enviados via cookies HTTP-only.
	"""
	message: str = Field(default="Login realizado com sucesso")
	user: dict = Field(
		...,
		description="Dados públicos do usuário logado"
	)


class LogoutResponse(BaseModel):
	"""Schema para resposta de logout."""
	message: str = Field(default="Logout realizado com sucesso")


class RefreshResponse(BaseModel):
	"""Schema para resposta de refresh de tokens."""
	message: str = Field(default="Token renovado com sucesso")


class TokenPayload(BaseModel):
	"""
	Schema para o payload interno do JWT.
	Usado internamente para tipagem.
	"""
	sub: str  # user_id
	type: str  # "access" ou "refresh"
	exp: int  # timestamp de expiração
	iat: int  # timestamp de emissão


class MessageResponse(BaseModel):
	"""Schema genérico para mensagens de resposta."""
	message: str
	detail: Optional[str] = None
