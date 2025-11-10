"""
Builders de usuário - Padrão Builder e Factory.

Este módulo implementa o padrão Builder para construção de diferentes tipos
de usuários (Produtor, Coletor, Receptor) e o padrão Factory para seleção
automática do builder adequado baseado no role_id.

Uso básico:
    >>> from src.builders.user import get_user_builder, UserBuilderFactory
    >>> 
    >>> # Criar builder a partir de documento do banco
    >>> doc = await user_repo.find_by_id(user_id)
    >>> builder = get_user_builder(doc)
    >>> user_data = builder.build_for_db()
    >>> 
    >>> # Criar builder vazio para novo usuário
    >>> builder = get_user_builder("produtor")
    >>> builder.with_name("João").with_email("joao@email.com")
    >>> builder.add_address({
    ...     "cep": "12345-678",
    ...     "logradouro": "Rua A",
    ...     "numero": "123",
    ...     "latitude": "-23.5505",
    ...     "longitude": "-46.6333"
    ... })
    >>> doc = builder.build_for_db()

Builders disponíveis:
    - ProdutorBuilder: Para usuários que geram resíduos
    - ColetorBuilder: Para usuários que coletam resíduos
    - ReceptorBuilder: Para pontos de recebimento de resíduos
"""

from .user_builder import UserBuilder
from .produtor_builder import ProdutorBuilder
from .coletor_builder import ColetorBuilder
from .receptor_builder import ReceptorBuilder
from .user_factory import UserBuilderFactory, get_user_builder

__all__ = [
    "UserBuilder",
    "ProdutorBuilder",
    "ColetorBuilder",
    "ReceptorBuilder",
    "UserBuilderFactory",
    "get_user_builder",
]
