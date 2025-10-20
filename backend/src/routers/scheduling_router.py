from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.schemas.scheduling_schema import (
    SchedulingCreate,
    SchedulingUpdate,
    SchedulingInDB,
    BuscarAgendamentosRequest,
    AgendamentoComDistancia,
)
from src.service.scheduling_service import SchedulingService
from src.infra.security.dependencies import get_current_user


router = APIRouter(
    prefix="/schedules",
    tags=["Agendamentos"],
    responses={
        401: {"description": "Não autenticado"},
        403: {"description": "Sem permissão"},
        404: {"description": "Agendamento não encontrado"},
    },
)

scheduling_service = SchedulingService()


@router.post(
    "/",
    response_model=SchedulingInDB,
    status_code=status.HTTP_201_CREATED,
    summary="Criar novo agendamento",
)
async def criar_agendamento(
    dados: SchedulingCreate,
    current_user: dict = Depends(get_current_user),
) -> SchedulingInDB:
    """
    Cria um novo agendamento de coleta.

    Regras:
    - Requer autenticação (token JWT via cookie)
    - O produtorId é obtido automaticamente do usuário autenticado
    - Apenas produtores podem criar agendamentos
    - Evita duplicidade de agendamento PENDENTE por resíduo
    """
    # Opcional: Validar se o usuário é produtor
    if current_user.get("role_id") != "produtor":
        raise HTTPException(403, "Apenas produtores podem criar agendamentos")
    
    produtor_id = current_user.get("id")
    if not produtor_id:
        raise HTTPException(401, "Usuário não autenticado corretamente")
    
    return await scheduling_service.criar_agendamento(dados, produtor_id)


@router.get(
    "/{scheduling_id}",
    response_model=SchedulingInDB,
    summary="Obter agendamento por ID",
)
async def obter_agendamento(
    scheduling_id: str,
    current_user: dict = Depends(get_current_user),
) -> SchedulingInDB:
    """
    Obtém um agendamento específico por ID.
    
    Regras de autorização:
    - Produtor: pode ver apenas seus próprios agendamentos
    - Cooperativa/Reciclador: pode ver qualquer agendamento (para aceitar coletas)
    """
    return await scheduling_service.obter_agendamento(scheduling_id, current_user)


@router.post(
    "/disponiveis",
    response_model=List[AgendamentoComDistancia],
    summary="Buscar agendamentos disponíveis por localização",
    description="""
    Busca agendamentos PENDENTE disponíveis para coleta baseado em:
    - **Localização**: Latitude, longitude e raio de busca
    - **Horário**: Data e hora atual para verificar disponibilidade
    - **Categorias** (opcional): Filtro por tipos de resíduos
    
    ## Funcionalidade
    
    Este endpoint é usado pelo **coletor** para encontrar agendamentos próximos
    que estejam disponíveis no momento atual.
    
    ## Filtros Aplicados
    
    1. ✅ Status PENDENTE
    2. ✅ Distância ≤ raio especificado
    3. ✅ Horário dentro do slot de disponibilidade
    4. ✅ Categorias de resíduos (opcional)
    
    ## Algoritmo Otimizado
    
    - Query geoespacial no MongoDB (cálculo de distância no banco)
    - Retorna apenas agendamentos no raio especificado
    - Ordenado por distância (mais próximo primeiro)
    - Inclui dados completos dos resíduos
    
    ## Autorização
    
    - Apenas usuários com role **"coletor"** podem usar este endpoint
    
    ## Exemplo de Uso
    
    ```json
    {
      "latitude": -5.0892,
      "longitude": -42.8019,
      "raio": 5.0,
      "data_busca": "22/10/2025",
      "hora_busca": "15:00",
      "categorias_ids": ["plastico_id", "metal_id"]
    }
    ```
    
    ## Resposta
    
    Lista de agendamentos ordenados por distância, cada um contendo:
    - Dados do agendamento (local, disponibilidade, etc.)
    - **distancia_km**: Distância calculada em quilômetros
    - **residuos**: Lista completa de resíduos com suas informações
    """,
    responses={
        200: {
            "description": "Lista de agendamentos disponíveis",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "674a1b2c3d4e5f6g7h8i9j0k",
                            "produtorId": "produtor_123",
                            "distancia_km": 0.87,
                            "local": {
                                "latitude": "-5.0900",
                                "longitude": "-42.8025",
                                "logradouro": "Rua das Flores",
                                "numero": "123"
                            },
                            "disponibilidade": [
                                {
                                    "data": "22/10/2025",
                                    "hora_inicio": "10:30",
                                    "hora_fim": "18:00"
                                }
                            ],
                            "residuos": [
                                {
                                    "id": "residuo_1",
                                    "categoriaId": "plastico_id",
                                    "quantidade": 5.0,
                                    "tipo_medida": "kg"
                                }
                            ],
                            "status": "PENDENTE"
                        }
                    ]
                }
            }
        },
        403: {"description": "Apenas coletores podem buscar agendamentos disponíveis"},
        422: {"description": "Erro de validação nos parâmetros de busca"}
    }
)
async def buscar_agendamentos_disponiveis(
    filtros: BuscarAgendamentosRequest,
    current_user: dict = Depends(get_current_user),
) -> List[AgendamentoComDistancia]:
    """
    Busca agendamentos disponíveis próximos ao coletor.
    
    Este endpoint implementa a lógica de busca geoespacial otimizada,
    permitindo que coletores encontrem agendamentos:
    - Dentro de um raio específico
    - Disponíveis no horário atual
    - Opcionalmente filtrados por categoria de resíduo
    
    O resultado é ordenado por distância (mais próximo primeiro).
    """
    return await scheduling_service.buscar_agendamentos_disponiveis(
        filtros=filtros,
        current_user=current_user
    )


@router.get(
    "/",
    response_model=List[SchedulingInDB],
    summary="Listar agendamentos",
)
async def listar_agendamentos(
    produtorId: Optional[str] = Query(None),
    residuoId: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
) -> List[SchedulingInDB]:
    """
    Lista agendamentos com filtros opcionais.
    
    Regras de autorização:
    - Produtor: lista apenas seus próprios agendamentos (filtro produtorId é ignorado)
    - Cooperativa/Reciclador: lista todos os agendamentos disponíveis
    """
    return await scheduling_service.listar_agendamentos(
        produtorId=produtorId,
        residuoId=residuoId,
        status=status,
        limit=limit,
        skip=skip,
        current_user=current_user,
    )


@router.patch(
    "/{scheduling_id}",
    response_model=SchedulingInDB,
    summary="Atualizar agendamento",
)
async def atualizar_agendamento(
    scheduling_id: str,
    dados: SchedulingUpdate,
    current_user: dict = Depends(get_current_user),
) -> SchedulingInDB:
    """
    Atualiza dados do agendamento.
    
    Regras de autorização:
    - Produtor: pode editar apenas seus próprios agendamentos
    - Cooperativa/Reciclador: NÃO pode editar (apenas atualizar status)
    """
    return await scheduling_service.atualizar_agendamento(scheduling_id, dados, current_user)


@router.patch(
    "/{scheduling_id}/status",
    response_model=SchedulingInDB,
    summary="Atualizar status do agendamento",
)
async def atualizar_status(
    scheduling_id: str,
    body: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
) -> SchedulingInDB:
    """
    Atualiza apenas o status do agendamento.
    
    Regras de autorização:
    - Produtor: pode atualizar status dos próprios agendamentos
    - Cooperativa/Reciclador: pode atualizar status de qualquer agendamento
    """
    new_status = body.get("status")
    if not new_status:
        raise HTTPException(400, "Campo 'status' é obrigatório")
    return await scheduling_service.atualizar_status(scheduling_id, new_status, current_user)


@router.delete(
    "/{scheduling_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar agendamento",
)
async def deletar_agendamento(
    scheduling_id: str,
    current_user: dict = Depends(get_current_user),
) -> None:
    """
    Deleta um agendamento.
    
    Regras de autorização:
    - Produtor: pode deletar apenas seus próprios agendamentos
    - Cooperativa/Reciclador: NÃO pode deletar agendamentos
    """
    await scheduling_service.deletar_agendamento(scheduling_id, current_user)
    return None