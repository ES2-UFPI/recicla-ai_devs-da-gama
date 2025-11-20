from pydantic import BaseModel, Field
from typing import List, Optional


class RankingEntry(BaseModel):
    user_id: str = Field(..., description="ID do usuário")
    name: Optional[str] = Field(None, description="Nome do usuário")
    cidade_id: Optional[str] = Field(None, description="ID da cidade")
    estado_id: Optional[str] = Field(None, description="ID do estado")
    ranking: int = Field(..., description="Pontos de ranking do usuário")
    position: Optional[int] = Field(None, description="Posição no ranking")


class RankingResponse(BaseModel):
    level: str = Field(..., description="Nível do ranking: global, estado, cidade")
    code: Optional[str] = Field(None, description="Código do nível (estado/cidade)")
    cidade_nome: Optional[str] = Field(None, description="Nome da cidade (quando level=cidade)")
    estado_nome: Optional[str] = Field(None, description="Nome do estado (quando level=estado)")
    total: int = Field(..., description="Número total de usuários considerados")
    top: List[RankingEntry] = Field(..., description="Top N usuários")
