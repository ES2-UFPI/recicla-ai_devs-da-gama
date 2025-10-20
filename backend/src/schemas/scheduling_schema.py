from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any
from datetime import datetime, timedelta


class LocalEndereco(BaseModel):
    """
    Representa o endereço completo de coleta.
    Este é um snapshot do endereço do produtor no momento da criação do agendamento.
    """
    address_id: int = Field(..., description="ID do endereço no array do usuário", example=1)
    apelido: Optional[str] = Field(None, description="Apelido do endereço", example="Casa")
    cep: str = Field(..., description="CEP", example="64000-000")
    logradouro: str = Field(..., description="Logradouro", example="Rua Exemplo")
    numero: str = Field(..., description="Número", example="123")
    complemento: Optional[str] = Field(None, description="Complemento", example="Apto 101")
    latitude: Optional[str] = Field(None, description="Latitude", example="-5.0892")
    longitude: Optional[str] = Field(None, description="Longitude", example="-42.8019")


class DisponibilidadeSlot(BaseModel):
    """
    Representa um slot de disponibilidade para coleta.
    
    Exemplo:
    {
        "data": "17/10/2025",
        "hora_inicio": "10:30",
        "hora_fim": "18:00"
    }
    """
    data: str = Field(..., description="Data no formato dd/mm/aaaa", example="17/10/2025")
    hora_inicio: str = Field(..., description="Horário de início no formato hh:mm", example="10:30")
    hora_fim: str = Field(..., description="Horário de fim no formato hh:mm", example="18:00")
    
    @field_validator('data')
    @classmethod
    def validar_formato_data(cls, v: str) -> str:
        """Valida formato da data (dd/mm/aaaa)"""
        try:
            datetime.strptime(v, "%d/%m/%Y")
            return v
        except ValueError:
            raise ValueError("Data deve estar no formato dd/mm/aaaa (ex: 17/10/2025)")
    
    @field_validator('hora_inicio', 'hora_fim')
    @classmethod
    def validar_formato_hora(cls, v: str) -> str:
        """Valida formato do horário (hh:mm)"""
        try:
            datetime.strptime(v, "%H:%M")
            return v
        except ValueError:
            raise ValueError("Horário deve estar no formato hh:mm (ex: 10:30)")
    
    def to_datetime_inicio(self) -> datetime:
        """Converte data + hora_inicio para datetime"""
        data_obj = datetime.strptime(self.data, "%d/%m/%Y")
        hora_obj = datetime.strptime(self.hora_inicio, "%H:%M")
        return data_obj.replace(hour=hora_obj.hour, minute=hora_obj.minute)
    
    def to_datetime_fim(self) -> datetime:
        """Converte data + hora_fim para datetime"""
        data_obj = datetime.strptime(self.data, "%d/%m/%Y")
        hora_obj = datetime.strptime(self.hora_fim, "%H:%M")
        return data_obj.replace(hour=hora_obj.hour, minute=hora_obj.minute)
    
    def validar_slot(self) -> None:
        """
        Valida o slot de disponibilidade:
        1. Hora de início deve ser menor que hora de fim
        2. Hora de início não pode ser no passado (tolerância de 30min)
        """
        dt_inicio = self.to_datetime_inicio()
        dt_fim = self.to_datetime_fim()
        agora = datetime.now()
        tolerancia = timedelta(minutes=30)
        
        # Validação 1: Início deve ser antes do fim
        if dt_inicio >= dt_fim:
            raise ValueError(
                f"Horário de início ({self.hora_inicio}) deve ser anterior ao horário de fim ({self.hora_fim})"
            )
        
        # Validação 2: Início não pode ser muito no passado (tolerância de 30min)
        if dt_inicio < (agora - tolerancia):
            raise ValueError(
                f"Horário de início não pode estar no passado. "
                f"Data/hora: {self.data} {self.hora_inicio} (tolerância: 30 minutos)"
            )
    
    def to_string(self) -> str:
        """Converte para string legível"""
        return f"{self.data} {self.hora_inicio}-{self.hora_fim}"


#modelo da rota para criação de agendamentos
class SchedulingCreate(BaseModel):
    """
    Schema para criação de agendamento.
    O produtorId é obtido automaticamente do usuário autenticado.
    O address_id será usado para buscar o endereço completo do usuário.
    """
    residuosId: list[str] = Field(..., example=["residuo_id1", "residuo_id2"])
    disponibilidade: list[DisponibilidadeSlot] = Field(
        ..., 
        description="Lista de slots de disponibilidade",
        example=[
            {
                "data": "17/10/2025",
                "hora_inicio": "10:30",
                "hora_fim": "18:00"
            },
            {
                "data": "18/10/2025",
                "hora_inicio": "11:00",
                "hora_fim": "17:00"
            }
        ]
    )
    address_id: int = Field(..., description="ID do endereço do produtor a ser usado na coleta", example=1)
    observacoes: Optional[str] = Field(None, example="Deixar os resíduos na portaria.")
    
    @field_validator('disponibilidade')
    @classmethod
    def validar_disponibilidade(cls, v: list[DisponibilidadeSlot]) -> list[DisponibilidadeSlot]:
        """Valida cada slot de disponibilidade"""
        if not v or len(v) == 0:
            raise ValueError("Deve haver pelo menos um slot de disponibilidade")
        
        # Valida cada slot individualmente
        for idx, slot in enumerate(v):
            try:
                slot.validar_slot()
            except ValueError as e:
                raise ValueError(f"Erro no slot {idx + 1}: {str(e)}")
        
        return v


#modelo da rota para atualização de agendamentos
class SchedulingUpdate(BaseModel):
    """
    Schema para atualização de agendamento.
    O produtorId não pode ser alterado após criação.
    O address_id será usado para buscar e atualizar o endereço completo.
    """
    residuosId: Optional[list[str]] = Field(None, example=["residuo_id1", "residuo_id2"])
    disponibilidade: Optional[list[DisponibilidadeSlot]] = Field(
        None,
        description="Lista de slots de disponibilidade",
        example=[
            {
                "data": "17/10/2025",
                "hora_inicio": "10:30",
                "hora_fim": "18:00"
            }
        ]
    )
    address_id: Optional[int] = Field(None, description="ID do endereço do produtor a ser usado na coleta", example=1)
    observacoes: Optional[str] = Field(None, example="Deixar os resíduos na portaria.")
    
    @field_validator('disponibilidade')
    @classmethod
    def validar_disponibilidade(cls, v: Optional[list[DisponibilidadeSlot]]) -> Optional[list[DisponibilidadeSlot]]:
        """Valida cada slot de disponibilidade se fornecido"""
        if v is None:
            return v
        
        if len(v) == 0:
            raise ValueError("Deve haver pelo menos um slot de disponibilidade")
        
        # Valida cada slot individualmente
        for idx, slot in enumerate(v):
            try:
                slot.validar_slot()
            except ValueError as e:
                raise ValueError(f"Erro no slot {idx + 1}: {str(e)}")
        
        return v


#modelo do banco de dados para agendamentos
class SchedulingInDB(BaseModel):
    """
    Schema de retorno do agendamento.
    A disponibilidade é armazenada como lista de objetos.
    O local é armazenado como objeto completo com dados do endereço.
    """
    id: str = Field(..., alias="_id", example="60c72b2f9b1d4c3a4c8e4d3e")
    produtorId: str
    residuosId: list[str]
    disponibilidade: list[dict[str, Any]]  # Armazena como lista de dicts no banco
    local: dict[str, Any]  # Armazena objeto completo do endereço
    status: str
    observacoes: Optional[str] = None


class BuscarAgendamentosRequest(BaseModel):
    """
    Schema para buscar agendamentos disponíveis por localização.
    Usado pelo coletor para encontrar agendamentos próximos.
    """
    latitude: float = Field(
        ..., 
        description="Latitude do centro de busca (posição do coletor)",
        ge=-90.0,
        le=90.0,
        example=-5.0892
    )
    longitude: float = Field(
        ..., 
        description="Longitude do centro de busca (posição do coletor)",
        ge=-180.0,
        le=180.0,
        example=-42.8019
    )
    raio: float = Field(
        ..., 
        description="Raio de busca em quilômetros",
        gt=0,
        le=100,  # Limite máximo de 100km para evitar buscas muito amplas
        example=5.0
    )
    data_busca: str = Field(
        ...,
        description="Data atual para verificar disponibilidade (formato dd/mm/aaaa)",
        example="22/10/2025"
    )
    hora_busca: str = Field(
        ...,
        description="Hora atual para verificar disponibilidade (formato hh:mm)",
        example="15:00"
    )
    categorias_ids: Optional[list[str]] = Field(
        None,
        description="IDs de categorias para filtrar. Se fornecido, retorna apenas agendamentos que contenham resíduos dessas categorias",
        example=["categoria_id1", "categoria_id2"]
    )
    
    @field_validator('raio')
    @classmethod
    def validar_raio(cls, v: float) -> float:
        """Valida se o raio está em um intervalo razoável"""
        if v <= 0:
            raise ValueError("Raio deve ser maior que zero")
        if v > 100:
            raise ValueError("Raio máximo permitido é 100km")
        return v
    
    @field_validator('data_busca')
    @classmethod
    def validar_data_busca(cls, v: str) -> str:
        """Valida formato da data (dd/mm/aaaa)"""
        try:
            datetime.strptime(v, "%d/%m/%Y")
            return v
        except ValueError:
            raise ValueError("Data deve estar no formato dd/mm/aaaa (ex: 22/10/2025)")
    
    @field_validator('hora_busca')
    @classmethod
    def validar_hora_busca(cls, v: str) -> str:
        """Valida formato do horário (hh:mm)"""
        try:
            datetime.strptime(v, "%H:%M")
            return v
        except ValueError:
            raise ValueError("Horário deve estar no formato hh:mm (ex: 15:00)")


class AgendamentoComDistancia(SchedulingInDB):
    """
    Schema de retorno de agendamento com informação de distância.
    Usado na resposta da busca por localização.
    """
    distancia_km: float = Field(
        ..., 
        description="Distância em quilômetros entre o coletor e o local de coleta"
    )
    residuos: list[dict[str, Any]] = Field(
        ...,
        description="Lista completa de resíduos do agendamento com suas informações"
    )