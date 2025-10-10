from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.infra.database.config.database import get_client
from src.routers.users_router import router as users_router

app = FastAPI(title="ReciclaAI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)

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