from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.infra.database.config.database import get_client
from src.routers.user_router import router as users_router
from src.routers.auth_router import router as auth_router
from src.routers.residue_router import router as residue_router
from src.routers.categoria_router import router as categoria_router
from src.routers.dev_router import router as dev_router
from src.routers.scheduling_router import router as scheduling_router
from src.routers.geo_router import router as geo_router

app = FastAPI(title="ReciclaAI API", version="0.1.0")

# Configuração CORS para suportar cookies HTTP-only
# Em produção, substitua "*" pelo domínio específico do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev
        "http://localhost:8000",  # Própria API
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
app.include_router(dev_router)  # Módulo de Desenvolvimento (seed, debug, etc.)
app.include_router(scheduling_router)  # Módulo de Agendamentos
app.include_router(geo_router)  # Módulo de Geocoding

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/db/ping")
async def db_ping():
    """
    Realiza ping no cluster do MongoDB Atlas para validar conectividade.
    Retorna informações detalhadas sobre o status do banco.
    """
    try:
        result = await get_client().admin.command("ping")
        if result.get("ok", 0) == 1:
            return {
                "ok": 1,
                "message": "Conexão com MongoDB bem-sucedida.",
                "details": result
            }
        else:
            return {
                "ok": 0,
                "message": "Falha ao conectar ao MongoDB.",
                "details": result
            }
    except Exception as e:
        return {
            "ok": 0,
            "message": "Erro ao conectar ao MongoDB.",
            "error": str(e)
        }

@app.on_event("shutdown")
def shutdown_mongo():
    try:
        get_client().close()
    except Exception:
        pass
