"""
Classe base para ObjectId do MongoDB com Pydantic v2
"""
from typing import Any
from bson import ObjectId


class PyObjectId(str):
    """
    Tipo customizado para ObjectId do MongoDB compatível com Pydantic v2.
    Serializa ObjectId como string para JSON.
    """
    
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type: Any, _handler):
        from pydantic_core import core_schema
        
        def validate(value: Any) -> str:
            if isinstance(value, ObjectId):
                return str(value)
            if isinstance(value, str):
                if ObjectId.is_valid(value):
                    return value
                raise ValueError("Invalid ObjectId")
            raise ValueError("Invalid ObjectId type")
        
        return core_schema.no_info_plain_validator_function(
            validate,
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            )
        )
