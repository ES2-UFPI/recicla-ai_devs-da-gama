"""
Builder específico para usuários do tipo Produtor.
Produtores são responsáveis por gerar resíduos e solicitar coletas.
"""
from typing import Dict, Any

from .user_builder import UserBuilder


class ProdutorBuilder(UserBuilder):
    """
    Builder concreto para criação de usuários Produtores.
    
    Campos específicos (conforme wiki):
    - address: string (endereço principal)
    - is_business: Optional[bool] (se é empresa ou pessoa física)
    - cnpj: Optional[string] (CNPJ se for empresa)
    - points: int (pontos de gamificação)
    - ranking: int (posição no ranking)
    """
    
    def __init__(self):
        super().__init__()
        self._role_id = "produtor"
        # Inicializar campos específicos de produtor
        self._user_data["points"] = 0
        self._user_data["ranking"] = 0
    
    def validate(self) -> bool:
        """
        Valida dados específicos de um Produtor.
        
        Returns:
            True se válido
            
        Raises:
            ValueError: Se dados inválidos
        """
        # Validações básicas
        if not self._user_data.get("name"):
            raise ValueError("Nome é obrigatório para Produtor")
        
        if not self._user_data.get("email"):
            raise ValueError("Email é obrigatório para Produtor")
        
        if not self._user_data.get("phone"):
            raise ValueError("Telefone é obrigatório para Produtor")
        
        # Produtores devem ter ao menos um endereço para solicitar coletas
        if not self._addresses or len(self._addresses) == 0:
            raise ValueError("Produtor deve ter pelo menos um endereço cadastrado")
        
        # Se is_business for True, CNPJ é obrigatório
        if self._user_data.get("is_business") is True:
            if not self._user_data.get("cnpj"):
                raise ValueError("CNPJ é obrigatório quando is_business é True")
        
        return True
    
    def build_for_db(self) -> Dict[str, Any]:
        """
        Constrói documento de Produtor para persistência no MongoDB.
        
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
        
        # Garantir que points e ranking existem
        if "points" not in doc:
            doc["points"] = 0
        if "ranking" not in doc:
            doc["ranking"] = 0
        
        # Remover _id se for None (para novos usuários)
        if doc.get("_id") is None:
            doc.pop("_id", None)
        
        return doc
    
    def with_is_business(self, is_business: bool) -> 'ProdutorBuilder':
        """
        Define se o produtor é uma empresa (True) ou pessoa física (False).
        
        Args:
            is_business: True para empresa, False para pessoa física
            
        Returns:
            Self para encadeamento fluente
        """
        self._user_data["is_business"] = is_business
        return self
    
    def with_cnpj(self, cnpj: str) -> 'ProdutorBuilder':
        """
        Define o CNPJ do produtor (obrigatório se is_business for True).
        
        Args:
            cnpj: CNPJ da empresa (formato: "00.000.000/0000-00")
            
        Returns:
            Self para encadeamento fluente
        """
        self._user_data["cnpj"] = cnpj
        return self
    
    def with_points(self, points: int) -> 'ProdutorBuilder':
        """
        Define os pontos de gamificação do produtor.
        
        Args:
            points: Número de pontos acumulados
            
        Returns:
            Self para encadeamento fluente
        """
        self._user_data["points"] = points
        return self
    
    def add_points(self, points: int) -> 'ProdutorBuilder':
        """
        Adiciona pontos ao total atual do produtor.
        
        Args:
            points: Pontos a serem adicionados
            
        Returns:
            Self para encadeamento fluente
        """
        current_points = self._user_data.get("points", 0)
        self._user_data["points"] = current_points + points
        return self
    
    def with_ranking(self, ranking: int) -> 'ProdutorBuilder':
        """
        Define a posição no ranking do produtor.
        
        Args:
            ranking: Posição no ranking (1 = primeiro lugar)
            
        Returns:
            Self para encadeamento fluente
        """
        self._user_data["ranking"] = ranking
        return self
