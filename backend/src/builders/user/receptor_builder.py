"""
Builder específico para usuários do tipo Receptor.
Receptores são pontos de coleta que recebem resíduos já coletados.
"""
from typing import Dict, Any, List

from .user_builder import UserBuilder


class ReceptorBuilder(UserBuilder):
    """
    Builder concreto para criação de usuários Receptores.
    
    Campos específicos (conforme wiki):
    - address: string (endereço do ponto de coleta)
    - accepted_material: list[string] (tipos de materiais/resíduos aceitos)
    """
    
    def __init__(self):
        super().__init__()
        self._role_id = "receptor"
        self._accepted_material: List[str] = []
    
    def validate(self) -> bool:
        """
        Valida dados específicos de um Receptor.
        
        Returns:
            True se válido
            
        Raises:
            ValueError: Se dados inválidos
        """
        # Validações básicas
        if not self._user_data.get("name"):
            raise ValueError("Nome é obrigatório para Receptor")
        
        if not self._user_data.get("email"):
            raise ValueError("Email é obrigatório para Receptor")
        
        if not self._user_data.get("phone"):
            raise ValueError("Telefone é obrigatório para Receptor")
        
        # Receptores devem ter pelo menos um endereço (ponto de coleta fixo)
        if not self._addresses or len(self._addresses) == 0:
            raise ValueError("Receptor deve ter um endereço (ponto de coleta)")
        
        # Receptor deve especificar tipos de materiais aceitos
        if not self._accepted_material or len(self._accepted_material) == 0:
            raise ValueError(
                "Receptor deve especificar ao menos um tipo de material aceito"
            )
        
        # Validar que accepted_material é uma lista
        if not isinstance(self._accepted_material, list):
            raise ValueError("accepted_material deve ser uma lista de strings")
        
        return True
    
    def build_for_db(self) -> Dict[str, Any]:
        """
        Constrói documento de Receptor para persistência no MongoDB.
        
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
        
        # Adicionar accepted_material específico de receptor
        doc["accepted_material"] = self._accepted_material
        
        # Remover _id se for None (para novos usuários)
        if doc.get("_id") is None:
            doc.pop("_id", None)
        
        return doc
    
    def with_accepted_material(self, materials: List[str]) -> 'ReceptorBuilder':
        """
        Define os tipos de materiais que o receptor aceita (substitui a lista atual).
        
        Args:
            materials: Lista de tipos de materiais (ex: ["plástico", "papel", "metal"])
            
        Returns:
            Self para encadeamento fluente
        """
        self._accepted_material = materials
        return self
    
    def add_accepted_material(self, material: str) -> 'ReceptorBuilder':
        """
        Adiciona um tipo de material aceito.
        
        Args:
            material: Tipo de material (ex: "vidro", "eletrônicos")
            
        Returns:
            Self para encadeamento fluente
        """
        if material not in self._accepted_material:
            self._accepted_material.append(material)
        return self
    
    def remove_accepted_material(self, material: str) -> 'ReceptorBuilder':
        """
        Remove um tipo de material da lista de aceitos.
        
        Args:
            material: Tipo de material a ser removido
            
        Returns:
            Self para encadeamento fluente
        """
        if material in self._accepted_material:
            self._accepted_material.remove(material)
        return self
