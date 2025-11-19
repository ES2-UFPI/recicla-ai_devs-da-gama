"""
Models do banco de dados - Módulo modularizado
Cada modelo em seu próprio arquivo para melhor organização
"""

from .base import PyObjectId
from .enums import StatusResiduo, AcaoHistorico, StatusAgendamento
from .user import User
from .categoria import CategoriaResiduo
from .residue import Residue
from .historico import HistoricoResiduo
from .scheduling import Scheduling
from .resgate_recompensa import ResgateRecompensa

__all__ = [
    # Base
    "PyObjectId",
    
    # Enums
    "StatusResiduo",
    "AcaoHistorico", 
    "StatusAgendamento",
    
    # Models
    "User",
    "CategoriaResiduo",
    "Residue",
    "HistoricoResiduo",
    "Scheduling",
    "ResgateRecompensa",
]
