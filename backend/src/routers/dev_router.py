"""
Router de desenvolvimento e utilitários.
Endpoints auxiliares para tarefas de setup, seed e debug.

⚠️ ATENÇÃO: Estes endpoints devem ser DESABILITADOS em produção!
"""

from fastapi import APIRouter
from src.infra.database.repositories import categoria_repo

router = APIRouter(
    prefix="/dev",
    tags=["🔧 Desenvolvimento"]
)


# Categorias padrão do sistema
CATEGORIAS_PADRAO = [
    {
        "tipo": "Plástico",
        "descricao": (
            "Garrafas PET, sacolas plásticas, embalagens de produtos de limpeza, "
            "potes de margarina, recipientes de xampu e condicionador. "
            "Aceito: PET, PEAD, PP. Não aceito: isopor, plástico filme sujo."
        ),
        "preco_por_kg": 2.50,
        "preco_por_unidade": None,
        "ativo": True
    },
    {
        "tipo": "Vidro",
        "descricao": (
            "Garrafas de bebidas (refrigerante, cerveja, vinho), potes de conserva, "
            "frascos de perfume e cosméticos, copos e vasilhames de vidro. "
            "Não aceito: espelhos, vidros de janela, lâmpadas, cristais."
        ),
        "preco_por_kg": 0.80,
        "preco_por_unidade": 0.15,  # R$ 0,15 por garrafa
        "ativo": True
    },
    {
        "tipo": "Papel",
        "descricao": (
            "Papelão, caixas de produtos, jornais, revistas, cadernos, papel de escritório, "
            "envelopes, folhetos e cartolinas. "
            "Não aceito: papel higiênico, guardanapos usados, papel plastificado, carbono."
        ),
        "preco_por_kg": 0.50,
        "preco_por_unidade": None,
        "ativo": True
    },
    {
        "tipo": "Metal",
        "descricao": (
            "Latas de alumínio (refrigerante, cerveja), latas de aço (alimentos), "
            "panelas velhas, talheres, fios de cobre, arames, tampas metálicas. "
            "Aceito: alumínio, aço, cobre, ferro. Não aceito: aerossóis com conteúdo."
        ),
        "preco_por_kg": 5.00,
        "preco_por_unidade": 0.08,  # R$ 0,08 por latinha
        "ativo": True
    },
    {
        "tipo": "Eletrônico",
        "descricao": (
            "Celulares, tablets, computadores, notebooks, teclados, mouses, cabos, "
            "carregadores, TVs, monitores, impressoras, componentes eletrônicos. "
            "Importante: deve ser encaminhado para descarte especial (e-lixo)."
        ),
        "preco_por_kg": 15.00,
        "preco_por_unidade": 5.00,  # R$ 5,00 por aparelho pequeno
        "ativo": True
    }
]


@router.get("/seed/categorias")
async def seed_categorias():
    """
    Popula o banco com categorias padrão de resíduos.
    
    ⚠️ Endpoint de desenvolvimento - use apenas em ambiente de dev/staging!
    
    Executa:
    - Verifica se cada categoria já existe (evita duplicação)
    - Cria categorias com preços por kg e por unidade
    - Retorna resumo com categorias criadas, existentes e erros
    
    Returns:
        dict: Resumo da operação com listas de criadas, existentes e erros
        
    Example Response:
        {
            "ok": 1,
            "criadas": [
                {
                    "tipo": "Vidro",
                    "id": "671234...",
                    "preco_kg": 0.8,
                    "preco_unidade": 0.15
                }
            ],
            "ja_existentes": ["Plástico"],
            "erros": [],
            "total_criadas": 4,
            "total_existentes": 1,
            "total_erros": 0
        }
    """
    criadas = []
    ja_existentes = []
    erros = []
    
    for cat_data in CATEGORIAS_PADRAO:
        tipo = cat_data["tipo"]
        try:
            # Verificar se já existe
            existente = await categoria_repo.buscar_por_tipo(tipo)
            
            if existente:
                ja_existentes.append(tipo)
                continue
            
            # Criar categoria
            categoria_id = await categoria_repo.criar_categoria(cat_data)
            criadas.append({
                "tipo": tipo,
                "id": categoria_id,
                "preco_kg": cat_data["preco_por_kg"],
                "preco_unidade": cat_data.get("preco_por_unidade")
            })
        except Exception as e:
            erros.append({"tipo": tipo, "erro": str(e)})
    
    return {
        "ok": 1,
        "criadas": criadas,
        "ja_existentes": ja_existentes,
        "erros": erros,
        "total_criadas": len(criadas),
        "total_existentes": len(ja_existentes),
        "total_erros": len(erros),
        "mensagem": f"✅ Seed concluído! {len(criadas)} criadas, {len(ja_existentes)} já existiam."
    }


@router.get("/seed/limpar-categorias")
async def limpar_categorias():
    """
    Remove TODAS as categorias do banco de dados.
    
    ⚠️⚠️⚠️ PERIGO: Este endpoint deleta todos os dados de categorias!
    Use apenas em ambiente de desenvolvimento para resetar o banco.
    
    Returns:
        dict: Número de categorias deletadas
    """
    try:
        resultado = await categoria_repo._collection().delete_many({})
        return {
            "ok": 1,
            "deletadas": resultado.deleted_count,
            "mensagem": f"🗑️ {resultado.deleted_count} categorias removidas do banco."
        }
    except Exception as e:
        return {
            "ok": 0,
            "erro": str(e),
            "mensagem": "❌ Erro ao limpar categorias."
        }


@router.get("/info")
async def info_dev():
    """
    Retorna informações sobre os endpoints de desenvolvimento disponíveis.
    
    Returns:
        dict: Lista de endpoints e suas descrições
    """
    return {
        "endpoints": {
            "GET /dev/seed/categorias": "Popula categorias padrão (Plástico, Vidro, Papel, Metal, Eletrônico)",
            "GET /dev/seed/limpar-categorias": "⚠️ Remove TODAS as categorias do banco",
            "GET /dev/info": "Exibe esta mensagem de ajuda"
        },
        "aviso": "⚠️ Estes endpoints são apenas para DESENVOLVIMENTO. Desabilite em produção!",
        "categorias_padrao": [cat["tipo"] for cat in CATEGORIAS_PADRAO],
        "total_categorias": len(CATEGORIAS_PADRAO)
    }
