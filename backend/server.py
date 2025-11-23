from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.infra.database.config.database import get_client
from src.routers.user_router import router as users_router
from src.routers.auth_router import router as auth_router
from src.routers.residue_router import router as residue_router
from src.routers.categoria_router import router as categoria_router
from src.routers.recompensa_router import router as recompensa_router
from src.routers.scheduling_router import router as scheduling_router
from src.routers.geo_router import router as geo_router
from src.routers.coleta_router import router as coleta_router
from src.routers.entrega_router import router as entrega_router
from src.routers.ranking_router import router as ranking_router
import os

app = FastAPI(title="ReciclaAI API", version="0.1.0")

# Configuração CORS para suportar cookies HTTP-only
# Em produção, substitua "*" pelo domínio específico do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev
        "http://localhost:8000",  # Própria API
        "https://*.onrender.com",  # Render.com
        "https://reciclaai-frontend.vercel.app",  # Vercel deployment
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth_router)
app.include_router(users_router)  # Módulo de Usuários
app.include_router(residue_router)  # Módulo de Resíduos
app.include_router(categoria_router)  # Módulo de Categorias
app.include_router(recompensa_router)  # Módulo de Recompensas (Gamificação)
app.include_router(scheduling_router)  # Módulo de Agendamentos
app.include_router(geo_router)  # Módulo de Geocoding
app.include_router(coleta_router)  # Módulo de Coletas
app.include_router(entrega_router)  # Módulo de Entregas
app.include_router(ranking_router)  # Módulo de Rankings

# Registrar endpoints de desenvolvimento apenas se habilitado no .env
# Em produção, defina ENABLE_DEV_ENDPOINTS=false no .env
if os.getenv("ENABLE_DEV_ENDPOINTS", "false").lower() == "true":
    from src.routers.dev_router import router as dev_router
    app.include_router(dev_router)  # Módulo de Desenvolvimento (seed, debug, etc.)
    print("⚠️  Dev endpoints habilitados! Defina ENABLE_DEV_ENDPOINTS=false em produção.")

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/db/ping")
async def db_ping():
    """
    Verifica a conectividade com o MongoDB.
    Útil para health checks e diagnóstico de problemas de conexão.
    """
    try:
        client = get_client()
        # Testa a conexão com timeout curto
        result = await client.admin.command("ping")
        
        if result.get("ok", 0) == 1:
            # Tenta obter informações adicionais (útil para debug)
            try:
                server_info = await client.server_info()
                return {
                    "status": "connected",
                    "message": "Conexão com MongoDB estabelecida com sucesso.",
                    "server_version": server_info.get("version"),
                    "using_atlas": os.getenv("USE_ATLAS", "false").lower() == "true"
                }
            except:
                return {
                    "status": "connected",
                    "message": "Conexão com MongoDB estabelecida com sucesso."
                }
        else:
            return {
                "status": "error",
                "message": "Falha ao conectar ao MongoDB.",
                "details": result
            }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "message": "Erro ao conectar ao MongoDB.",
            "error": str(e),
            "error_type": type(e).__name__,
            # Incluir traceback apenas se dev endpoints estiverem habilitados
            "traceback": traceback.format_exc() if os.getenv("ENABLE_DEV_ENDPOINTS", "false").lower() == "true" else None
        }

@app.on_event("shutdown")
def shutdown_mongo():
    try:
        get_client().close()
    except Exception:
        pass

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
