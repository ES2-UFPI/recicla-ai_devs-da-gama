class EntregaService:
    """
    Camada de serviço para lógica de negócio de entregas.
    Gerencia a entrega de resíduos do coletor para a receptora.
    """

    @staticmethod
    async def criar_entrega(coletor_id: str, entrega_payload):
        """
        Cria uma nova entrega de resíduos.
        
        Args:
            coletor_id: ID do coletor que está fazendo a entrega
            entrega_payload: Dados da entrega (receptora, resíduos, observações)
            
        Returns:
            EntregaResponse: Dados da entrega criada
            
        Raises:
            HTTPException: Se houver erro na validação ou criação
        """
        pass