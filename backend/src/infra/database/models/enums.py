"""
Enums compartilhados entre os models
"""
from enum import Enum


class StatusResiduo(str, Enum):
    """Estados possíveis de um resíduo no ciclo de vida"""
    DISPONIVEL = "DISPONIVEL"
    AGENDADO = "AGENDADO"
    RESERVADO = "RESERVADO"
    COLETADO = "COLETADO"
    REJEITADO = "REJEITADO"
    ENTREGUE = "ENTREGUE"
    DESCARTADO = "DESCARTADO"


class AcaoHistorico(str, Enum): # vê se estamos usando
    """Ações que podem ser registradas no histórico"""
    CRIADO = "CRIADO"
    AGENDADO = "AGENDADO"
    COLETADO = "COLETADO"
    REJEITADO = "REJEITADO"
    ENTREGUE = "ENTREGUE"
    DESCARTADO = "DESCARTADO"


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
    DESCARTADA = "DESCARTADA" # pode pensar em outro nome melhor