"""
Enums compartilhados entre os models
"""
from enum import Enum


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


class StatusAgendamento(str, Enum):
    """Estados possíveis de um agendamento"""
    PENDENTE = "PENDENTE"
    CONCLUIDO = "CONCLUIDO"
    CANCELADO = "CANCELADO"

class EstadoColeta(str, Enum):
    """Estados possíveis de uma coleta"""
    PENDENTE = "PENDENTE"
    EM_ANDAMENTO = "EM_ANDAMENTO"
    CONCLUIDA = "CONCLUIDA"
    CANCELADA = "CANCELADA"