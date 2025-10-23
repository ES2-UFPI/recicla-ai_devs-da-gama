"""
Sistema de blacklist para gerenciar tokens revogados (logout).
Implementa cache em memória com limpeza automática de tokens expirados.

Nota: Em produção, considere usar Redis para blacklist distribuída.
"""
from datetime import datetime
from typing import Set, Dict
from threading import Lock


class TokenBlacklist:
	"""
	Gerencia tokens revogados em memória.
	Thread-safe para uso em aplicações assíncronas.
	"""
	
	def __init__(self):
		# Dict: token -> datetime de expiração
		self._blacklist: Dict[str, datetime] = {}
		self._lock = Lock()
	
	def add(self, token: str, expires_at: datetime) -> None:
		"""
		Adiciona um token à blacklist.
		
		Args:
			token: Token JWT a ser revogado
			expires_at: Data/hora de expiração natural do token
		"""
		with self._lock:
			self._blacklist[token] = expires_at
			# Aproveita para limpar tokens expirados
			self._cleanup_expired()
	
	def is_blacklisted(self, token: str) -> bool:
		"""
		Verifica se um token está na blacklist.
		
		Args:
			token: Token JWT a ser verificado
			
		Returns:
			bool: True se o token está revogado
		"""
		with self._lock:
			# Remove se já expirou naturalmente
			if token in self._blacklist:
				if self._blacklist[token] <= datetime.utcnow():
					del self._blacklist[token]
					return False
				return True
			return False
	
	def _cleanup_expired(self) -> None:
		"""
		Remove tokens que já expiraram naturalmente.
		Chamado automaticamente ao adicionar novos tokens.
		"""
		now = datetime.utcnow()
		expired_tokens = [
			token for token, exp in self._blacklist.items() 
			if exp <= now
		]
		for token in expired_tokens:
			del self._blacklist[token]
	
	def size(self) -> int:
		"""Retorna o número de tokens atualmente na blacklist."""
		with self._lock:
			self._cleanup_expired()
			return len(self._blacklist)
	
	def clear(self) -> None:
		"""Limpa completamente a blacklist. Útil para testes."""
		with self._lock:
			self._blacklist.clear()


# Instância global do blacklist
token_blacklist = TokenBlacklist()
