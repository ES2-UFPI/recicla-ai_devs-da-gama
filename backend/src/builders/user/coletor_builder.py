"""
Builder específico para usuários do tipo Coletor.
Coletores são responsáveis por realizar coletas de resíduos.
"""
from typing import Dict, Any, List

from .user_builder import UserBuilder


class ColetorBuilder(UserBuilder):
    """
    Builder concreto para criação de usuários Coletores.
    
    Campos específicos (conforme wiki):
    - inventory: list[string] (lista de IDs de resíduos coletados/em estoque)
    """
    
    def __init__(self):
        super().__init__()
        self._role_id = "coletor"
        self._inventory: List[str] = []
    
    def validate(self) -> bool:
        """
        Valida dados específicos de um Coletor.
        
        Returns:
            True se válido
            
        Raises:
            ValueError: Se dados inválidos
        """
        # Validações básicas
        if not self._user_data.get("name"):
            raise ValueError("Nome é obrigatório para Coletor")
        
        if not self._user_data.get("email"):
            raise ValueError("Email é obrigatório para Coletor")
        
        if not self._user_data.get("phone"):
            raise ValueError("Telefone é obrigatório para Coletor")
        
        # Validar que inventory é uma lista (se fornecido)
        if self._inventory and not isinstance(self._inventory, list):
            raise ValueError("Inventory deve ser uma lista de strings")
        
        return True
    
    def build_for_db(self) -> Dict[str, Any]:
        """
        Constrói documento de Coletor para persistência no MongoDB.
        
        Returns:
            Documento completo para inserção/atualização
        """
        # Validar antes de construir
        self.validate()
        
        # Garantir que role_id está correto
        self._user_data["role_id"] = self._role_id
        
        # Construir documento final
        doc = {**self._user_data}
        doc["addresses"] = self._addresses
        
        # Adicionar inventory específico de coletor
        doc["inventory"] = self._inventory
        
        # Remover _id se for None (para novos usuários)
        if doc.get("_id") is None:
            doc.pop("_id", None)
        
        return doc
    
    def with_inventory(self, inventory: List[str]) -> 'ColetorBuilder':
        """
        Define o inventário completo do coletor (substitui o atual).
        
        Args:
            inventory: Lista de IDs de resíduos no inventário
            
        Returns:
            Self para encadeamento fluente
        """
        self._inventory = inventory
        return self
    
    def add_to_inventory(self, residue_id: str) -> 'ColetorBuilder':
        """
        Adiciona um resíduo ao inventário do coletor.
        
        Args:
            residue_id: ID do resíduo a ser adicionado
            
        Returns:
            Self para encadeamento fluente
        """
        if residue_id not in self._inventory:
            self._inventory.append(residue_id)
        return self
    
    def remove_from_inventory(self, residue_id: str) -> 'ColetorBuilder':
        """
        Remove um resíduo do inventário do coletor.
        
        Args:
            residue_id: ID do resíduo a ser removido
            
        Returns:
            Self para encadeamento fluente
        """
        if residue_id in self._inventory:
            self._inventory.remove(residue_id)
        return self
    
    def clear_inventory(self) -> 'ColetorBuilder':
        """
        Limpa todo o inventário do coletor.
        
        Returns:
            Self para encadeamento fluente
        """
        self._inventory = []
        return self
