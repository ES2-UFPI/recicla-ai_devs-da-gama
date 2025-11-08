"""
Factory para criação de builders de usuário.
Implementa o padrão Factory Method para retornar o builder adequado baseado no role_id.
"""
from typing import Dict, Any

from .user_builder import UserBuilder
from .produtor_builder import ProdutorBuilder
from .coletor_builder import ColetorBuilder
from .receptor_builder import ReceptorBuilder


class UserBuilderFactory:
    """
    Factory que cria o builder apropriado baseado no tipo de usuário.
    
    Esta classe decide qual builder concreto usar com base no role_id
    do usuário, seguindo o padrão Factory Method.
    """
    
    # Mapeamento de role_id para classes de builder
    _BUILDERS_MAP = {
        "produtor": ProdutorBuilder,
        "coletor": ColetorBuilder,
        "receptor": ReceptorBuilder,
    }
    
    @classmethod
    def create_from_document(cls, doc: Dict[str, Any]) -> UserBuilder:
        """
        Cria um builder a partir de um documento do banco de dados.
        
        Args:
            doc: Documento do MongoDB contendo dados do usuário
            
        Returns:
            Builder apropriado já inicializado com os dados do documento
            
        Raises:
            ValueError: Se o role_id não for reconhecido
            
        Example:
            >>> doc = await user_repo.find_by_id(user_id)
            >>> builder = UserBuilderFactory.create_from_document(doc)
            >>> user_data = builder.build_for_db()
        """
        if not doc:
            raise ValueError("Documento de usuário não pode ser None ou vazio")
        
        role_id = doc.get("role_id", "").lower()
        
        # Obter classe do builder baseado no role_id
        builder_class = cls._BUILDERS_MAP.get(role_id)
        
        if not builder_class:
            raise ValueError(
                f"Role '{role_id}' não reconhecido. "
                f"Roles válidos: {', '.join(cls._BUILDERS_MAP.keys())}"
            )
        
        # Criar instância do builder e inicializar com dados do documento
        builder = builder_class()
        builder.from_document(doc)
        
        return builder
    
    @classmethod
    def create_from_role(cls, role_id: str) -> UserBuilder:
        """
        Cria um builder vazio baseado apenas no role_id.
        
        Args:
            role_id: Tipo de usuário ("produtor", "coletor", "receptor")
            
        Returns:
            Builder apropriado (vazio, pronto para receber dados)
            
        Raises:
            ValueError: Se o role_id não for reconhecido
            
        Example:
            >>> builder = UserBuilderFactory.create_from_role("produtor")
            >>> builder.with_name("João").with_email("joao@email.com")
            >>> user_data = builder.build_for_db()
        """
        role_id = role_id.lower()
        
        builder_class = cls._BUILDERS_MAP.get(role_id)
        
        if not builder_class:
            raise ValueError(
                f"Role '{role_id}' não reconhecido. "
                f"Roles válidos: {', '.join(cls._BUILDERS_MAP.keys())}"
            )
        
        return builder_class()
    
    @classmethod
    def create_produtor(cls) -> ProdutorBuilder:
        """
        Cria um builder específico para Produtor.
        
        Returns:
            ProdutorBuilder vazio pronto para configuração
            
        Example:
            >>> builder = UserBuilderFactory.create_produtor()
            >>> builder.with_name("João").with_is_business(True).with_cnpj("12.345.678/0001-90")
            >>> doc = builder.build_for_db()
        """
        return ProdutorBuilder()
    
    @classmethod
    def create_coletor(cls) -> ColetorBuilder:
        """
        Cria um builder específico para Coletor.
        
        Returns:
            ColetorBuilder vazio pronto para configuração
            
        Example:
            >>> builder = UserBuilderFactory.create_coletor()
            >>> builder.with_name("Maria").with_inventory(["residue_123", "residue_456"])
            >>> doc = builder.build_for_db()
        """
        return ColetorBuilder()
    
    @classmethod
    def create_receptor(cls) -> ReceptorBuilder:
        """
        Cria um builder específico para Receptor.
        
        Returns:
            ReceptorBuilder vazio pronto para configuração
            
        Example:
            >>> builder = UserBuilderFactory.create_receptor()
            >>> builder.with_name("Ponto Central").with_accepted_material(["plástico", "papel"])
            >>> doc = builder.build_for_db()
        """
        return ReceptorBuilder()
    
    @classmethod
    def get_supported_roles(cls) -> list:
        """
        Retorna a lista de roles suportados.
        
        Returns:
            Lista de role_ids válidos
        """
        return list(cls._BUILDERS_MAP.keys())
    
    @classmethod
    def register_builder(cls, role_id: str, builder_class: type) -> None:
        """
        Registra um novo builder customizado (extensibilidade).
        
        Args:
            role_id: Identificador do role
            builder_class: Classe do builder (deve herdar de UserBuilder)
            
        Raises:
            TypeError: Se builder_class não herdar de UserBuilder
            
        Example:
            >>> class AdminBuilder(UserBuilder):
            ...     pass
            >>> UserBuilderFactory.register_builder("admin", AdminBuilder)
        """
        if not issubclass(builder_class, UserBuilder):
            raise TypeError(
                f"{builder_class.__name__} deve herdar de UserBuilder"
            )
        
        cls._BUILDERS_MAP[role_id.lower()] = builder_class


# Função auxiliar para facilitar uso direto
def get_user_builder(role_id_or_doc) -> UserBuilder:
    """
    Função auxiliar que cria um builder baseado em role_id ou documento.
    
    Args:
        role_id_or_doc: String com role_id ou Dict com documento do banco
        
    Returns:
        Builder apropriado
        
    Example:
        >>> # Usando com role_id
        >>> builder = get_user_builder("produtor")
        >>> 
        >>> # Usando com documento
        >>> doc = await user_repo.find_by_id(user_id)
        >>> builder = get_user_builder(doc)
    """
    if isinstance(role_id_or_doc, dict):
        return UserBuilderFactory.create_from_document(role_id_or_doc)
    elif isinstance(role_id_or_doc, str):
        return UserBuilderFactory.create_from_role(role_id_or_doc)
    else:
        raise TypeError(
            "Argumento deve ser string (role_id) ou dict (documento do banco)"
        )
