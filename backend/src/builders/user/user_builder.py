"""
Builder base abstrato para construção de usuários.
Implementa o padrão Builder para criar objetos User a partir de documentos do MongoDB.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from passlib.context import CryptContext

from src.schemas.user_schema import UserCreate, Endereco
from src.schemas.return_schema import UserPublic

# Context para hash de senha
pwd_ctx = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")


class UserBuilder(ABC):
    """
    Builder abstrato para construção de usuários.
    Define a interface comum para todos os builders de usuário.
    """
    
    def __init__(self):
        self.reset()
    
    def reset(self) -> None:
        """Reinicia o builder para começar uma nova construção."""
        self._user_data: Dict[str, Any] = {}
        self._addresses: List[Dict[str, Any]] = []
    
    def from_document(self, doc: Dict[str, Any]) -> 'UserBuilder':
        """
        Inicializa o builder a partir de um documento do banco de dados.
        
        Args:
            doc: Documento do MongoDB contendo dados do usuário
            
        Returns:
            Self para encadeamento fluente
        """
        self._user_data = {
            "_id": doc.get("_id"),
            "name": doc.get("name", ""),
            "email": doc.get("email", ""),
            "phone": doc.get("phone", ""),
            "password_hash": doc.get("password_hash", ""),
            "role_id": doc.get("role_id", ""),
            "cidade_id": doc.get("cidade_id", ""),
            "estado_id": doc.get("estado_id", ""),
        }
        self._addresses = doc.get("addresses", [])
        return self
    
    def from_create_payload(self, payload: UserCreate) -> 'UserBuilder':
        """
        Inicializa o builder a partir de um payload de criação.
        
        Args:
            payload: Dados de criação do usuário
            
        Returns:
            Self para encadeamento fluente
        """
        self._user_data = {
            "name": payload.name,
            "email": payload.email,
            "phone": payload.phone,
            "password_hash": pwd_ctx.hash(payload.password),
            "role_id": payload.role_id,
            "cidade_id": payload.cidade_id,
            "estado_id": payload.estado_id,
        }
        
        # Processar endereços se fornecidos
        if payload.addresses:
            self._addresses = [addr.model_dump() for addr in payload.addresses]
            # Adicionar IDs incrementais se não existirem
            for idx, addr in enumerate(self._addresses, start=1):
                if "id" not in addr or addr["id"] is None:
                    addr["id"] = idx
        
        return self
    
    def with_name(self, name: str) -> 'UserBuilder':
        """Define o nome do usuário."""
        self._user_data["name"] = name
        return self
    
    def with_email(self, email: str) -> 'UserBuilder':
        """Define o email do usuário."""
        self._user_data["email"] = email.strip().lower()
        return self
    
    def with_phone(self, phone: str) -> 'UserBuilder':
        """Define o telefone do usuário."""
        self._user_data["phone"] = phone
        return self
    
    def with_password(self, password: str) -> 'UserBuilder':
        """Define a senha do usuário (será hasheada automaticamente)."""
        self._user_data["password_hash"] = pwd_ctx.hash(password)
        return self
    
    def with_addresses(self, addresses: List[Dict[str, Any]]) -> 'UserBuilder':
        """Define a lista de endereços do usuário."""
        self._addresses = addresses
        return self
    
    def add_address(self, address: Dict[str, Any]) -> 'UserBuilder':
        """
        Adiciona um endereço ao usuário.
        
        Args:
            address: Dados do endereço
            
        Returns:
            Self para encadeamento fluente
        """
        # Gerar ID incremental automaticamente
        next_id = max([addr.get("id", 0) for addr in self._addresses], default=0) + 1
        if "id" not in address or address["id"] is None:
            address["id"] = next_id
        
        self._addresses.append(address)
        return self
    
    @abstractmethod
    def validate(self) -> bool:
        """
        Valida os dados do usuário de acordo com regras específicas do tipo.
        Deve ser implementado por cada builder concreto.
        
        Returns:
            True se os dados são válidos
            
        Raises:
            ValueError: Se os dados forem inválidos
        """
        pass
    
    @abstractmethod
    def build_for_db(self) -> Dict[str, Any]:
        """
        Constrói o documento final para persistência no MongoDB.
        Deve ser implementado por cada builder concreto.
        
        Returns:
            Documento pronto para ser inserido/atualizado no banco
        """
        pass
    
    def build_public(self) -> UserPublic:
        """
        Constrói a representação pública do usuário.
        
        Returns:
            UserPublic com dados públicos do usuário
        """
        return UserPublic(
            name=self._user_data.get("name", ""),
            email=self._user_data.get("email", ""),
            role_id=self._user_data.get("role_id", "")
        )
    
    def get_user_data(self) -> Dict[str, Any]:
        """Retorna os dados do usuário em construção (para debug/teste)."""
        return {**self._user_data, "addresses": self._addresses}
