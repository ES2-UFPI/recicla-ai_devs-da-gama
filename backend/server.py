from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.infra.database.config.database import get_client

app = FastAPI(title="ReciclaAI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/db/ping")
async def db_ping():
    """Realiza ping no cluster do MongoDB Atlas para validar conectividade."""
    try:
        result = await get_client().admin.command("ping")
        return {"ok": result.get("ok", 0)}
    except Exception as e:
        return {"ok": 0, "error": str(e)}

@app.on_event("shutdown")
def shutdown_mongo():
    try:
        get_client().close()
    except Exception:
        pass