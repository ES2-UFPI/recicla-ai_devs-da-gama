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


@router.get("/seed/heavy")
async def seed_heavy():
    """
    Executa seed pesado do banco de dados completo.
    
    ⚠️ Endpoint de desenvolvimento - use apenas em ambiente de dev/staging!
    
    Popula o banco com:
    - Categorias padrão (5 tipos)
    - 12 Produtores (pessoas físicas e empresas)
    - 6 Coletores
    - 4 Receptoras (ecopontos)
    - ~60 Resíduos
    - ~25 Agendamentos
    - ~18 Coletas (em diferentes estados)
    - ~12 Entregas
    
    Credenciais de acesso:
    - Email: qualquer.usuario@reciclaai.com.br (ex: joao.silva@reciclaai.com.br)
    - Senha: Senha@123
    
    Returns:
        dict: Resumo da operação com quantidades criadas
    """
    import sys
    from pathlib import Path
    
    # Importar o módulo de seed
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from scripts.seed_heavy import (
        seed_categorias,
        seed_produtores,
        seed_coletores,
        seed_receptoras,
        seed_residuos,
        seed_agendamentos,
        seed_coletas,
        seed_entregas
    )
    
    try:
        # Executar seeds em ordem
        categoria_ids = await seed_categorias()
        produtor_ids = await seed_produtores(quantidade=12)
        coletor_ids = await seed_coletores(quantidade=6)
        receptora_ids = await seed_receptoras(quantidade=4)
        residuo_ids = await seed_residuos(produtor_ids, categoria_ids, quantidade_por_produtor=5)
        agendamento_ids = await seed_agendamentos(produtor_ids, residuo_ids, quantidade=25)
        coleta_ids = await seed_coletas(agendamento_ids, coletor_ids, quantidade=18)
        entrega_ids = await seed_entregas(coleta_ids, receptora_ids, quantidade=12)
        
        return {
            "ok": 1,
            "resumo": {
                "categorias": len(categoria_ids),
                "produtores": len(produtor_ids),
                "coletores": len(coletor_ids),
                "receptoras": len(receptora_ids),
                "residuos": len(residuo_ids),
                "agendamentos": len(agendamento_ids),
                "coletas": len(coleta_ids),
                "entregas": len(entrega_ids)
            },
            "credenciais": {
                "email": "qualquer.usuario@reciclaai.com.br",
                "senha": "Senha@123",
                "exemplos": [
                    "joao.silva@reciclaai.com.br",
                    "maria.santos@reciclaai.com.br",
                    "marcos.coletor@reciclaai.com.br",
                    "ecoponto.centro@reciclaai.com.br"
                ]
            },
            "mensagem": "✅ Seed pesado concluído com sucesso!"
        }
    except Exception as e:
        return {
            "ok": 0,
            "erro": str(e),
            "mensagem": "❌ Erro ao executar seed pesado."
        }


@router.get("/seed/gestor-recompensas")
async def seed_gestor_recompensas():
    """
    Cria um usuário gestor de recompensas para gerenciar o catálogo de prêmios.
    
    ⚠️ Endpoint de desenvolvimento - use apenas em ambiente de dev/staging!
    
    Credenciais criadas:
    - Email: gestor.recompensas@reciclaai.com.br
    - Senha: GestorRecompensas@2024
    - Role: gestor_recompensas
    
    Este usuário pode:
    - Criar novas recompensas
    - Atualizar recompensas existentes
    - Ajustar estoque de recompensas
    - Desativar/reativar recompensas
    
    Returns:
        dict: Dados do usuário criado e credenciais de acesso
    """
    from src.infra.database.repositories import user_repo
    from passlib.context import CryptContext
    
    pwd_ctx = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")
    
    email = "gestor.recompensas@reciclaai.com.br"
    
    try:
        # Verificar se já existe
        existente = await user_repo.find_by_email(email)
        
        if existente:
            return {
                "ok": 1,
                "mensagem": "✅ Gestor de recompensas já existe!",
                "credenciais": {
                    "email": email,
                    "senha": "GestorRecompensas@2024",
                    "role": "gestor_recompensas"
                },
                "ja_existia": True
            }
        
        # Criar usuário gestor
        user_data = {
            "name": "Gestor de Recompensas",
            "email": email,
            "phone": "(86) 99999-9999",
            "password_hash": pwd_ctx.hash("GestorRecompensas@2024"),
            "role_id": "gestor_recompensas",
            "cidade_id": "teresina",
            "estado_id": "piaui",
            "addresses": []
        }
        
        user_id = await user_repo.create_user(user_data)
        
        return {
            "ok": 1,
            "mensagem": "✅ Gestor de recompensas criado com sucesso!",
            "user_id": user_id,
            "credenciais": {
                "email": email,
                "senha": "GestorRecompensas@2024",
                "role": "gestor_recompensas"
            },
            "permissoes": [
                "Criar recompensas",
                "Atualizar recompensas",
                "Ajustar estoque",
                "Desativar/reativar recompensas"
            ]
        }
    except Exception as e:
        return {
            "ok": 0,
            "erro": str(e),
            "mensagem": "❌ Erro ao criar gestor de recompensas."
        }


@router.get("/seed/recompensas")
async def seed_recompensas():
    """
    Popula o banco com recompensas diversas para o sistema de gamificação.
    
    ⚠️ Endpoint de desenvolvimento - use apenas em ambiente de dev/staging!
    
    Cria recompensas variadas:
    - Produtos físicos (ecobags, garrafas, kits, mudas, livros)
    - Vouchers e vales-compra (R$ 25, R$ 50, R$ 100, cinema, restaurante)
    - Descontos (produtos orgânicos, limpeza ecológica, cursos)
    - Cupons de serviços (visitas, workshops, plantio de árvores)
    - Recompensas especiais/sazonais
    - Algumas inativas (para testes)
    
    Total: ~25 recompensas variadas
    
    Returns:
        dict: Resumo da operação com recompensas criadas
    """
    import sys
    from pathlib import Path
    
    # Importar o módulo de seed
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from scripts.seed_recompensas import seed_recompensas as executar_seed
    
    try:
        recompensa_ids = await executar_seed(limpar_antes=False)
        
        return {
            "ok": 1,
            "total_criadas": len(recompensa_ids),
            "recompensa_ids": recompensa_ids,
            "mensagem": f"✅ {len(recompensa_ids)} recompensas cadastradas com sucesso!"
        }
    except Exception as e:
        return {
            "ok": 0,
            "erro": str(e),
            "mensagem": "❌ Erro ao criar recompensas."
        }


@router.get("/seed/limpar-recompensas")
async def limpar_recompensas():
    """
    Remove TODAS as recompensas do banco de dados.
    
    ⚠️⚠️⚠️ PERIGO: Este endpoint deleta todos os dados de recompensas!
    Use apenas em ambiente de desenvolvimento para resetar o banco.
    
    Returns:
        dict: Número de recompensas deletadas
    """
    import sys
    from pathlib import Path
    
    # Importar o módulo de seed
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from scripts.seed_recompensas import limpar_recompensas as executar_limpeza
    
    try:
        deletadas = await executar_limpeza()
        return {
            "ok": 1,
            "deletadas": deletadas,
            "mensagem": f"🗑️ {deletadas} recompensas removidas do banco."
        }
    except Exception as e:
        return {
            "ok": 0,
            "erro": str(e),
            "mensagem": "❌ Erro ao limpar recompensas."
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
            "GET /dev/seed/recompensas": "🎁 Popula ~25 recompensas variadas (produtos, vouchers, descontos, cupons)",
            "GET /dev/seed/gestor-recompensas": "👤 Cria usuário gestor de recompensas (gestor.recompensas@reciclaai.com.br)",
            "GET /dev/seed/heavy": "🚀 Popula banco completo (12 produtores, 6 coletores, 4 receptoras, ~60 resíduos, etc)",
            "GET /dev/seed/limpar-categorias": "⚠️ Remove TODAS as categorias do banco",
            "GET /dev/seed/limpar-recompensas": "⚠️ Remove TODAS as recompensas do banco",
            "GET /dev/info": "Exibe esta mensagem de ajuda"
        },
        "aviso": "⚠️ Estes endpoints são apenas para DESENVOLVIMENTO. Desabilite em produção!",
        "categorias_padrao": [cat["tipo"] for cat in CATEGORIAS_PADRAO],
        "total_categorias": len(CATEGORIAS_PADRAO),
        "total_recompensas": 25
    }
