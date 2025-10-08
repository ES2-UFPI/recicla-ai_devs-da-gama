from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware

# from src.routers.users_router import router as users_router
# from src.infra.database.config.database import get_db
# from src.infra.database.repositories.user_repo import UserRepository

app = FastAPI(title="ReciclaAI API", version="0.1.0")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# app.include_router(users_router, prefix="/api/users", tags=["users"])

@app.get("/health")
async def health():
    return {"status": "ok"}

