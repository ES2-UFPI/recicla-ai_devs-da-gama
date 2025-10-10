from fastapi import APIRouter, HTTPException, status
from passlib.context import CryptContext

from src.schemas.user_schema import UserCreate, UserInDB
from src.schemas.return_schema import UserPublic
from src.infra.database.repositories import user_repo

router = APIRouter(prefix="/users", tags=["users"])

# Use bcrypt_sha256 to avoid the 72-byte password input limit of raw bcrypt
pwd_ctx = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")


@router.post("", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreate):
	try:
		# Check duplicate email
		existing = await user_repo.find_by_email(payload.email)
		if existing:
			raise HTTPException(status_code=409, detail="E-mail já cadastrado.")

		# Hash password
		password_hash = pwd_ctx.hash(payload.password)

		doc = {
			"name": payload.name,
			"email": payload.email,
			"phone": payload.phone,
			"password_hash": password_hash,
			"role_id": payload.role_id,
			"cidade_id": payload.cidade_id,
			"estado_id": payload.estado_id,
		}

		inserted_id = await user_repo.create_user(doc)
		created = await user_repo.find_by_id(inserted_id)
		if not created:
			# Fallback: should not happen, but provide a clear server error
			raise HTTPException(status_code=500, detail="Falha ao recuperar usuário criado.")
		return {
			"name": created["name"],
			"email": created["email"],
			"role_id": created["role_id"],
		}
	except HTTPException:
		raise
	except Exception as e:
		# Provide more context during development
		raise HTTPException(status_code=500, detail=f"Erro ao criar usuário: {e.__class__.__name__}: {str(e)}")

@router.get("/{user_id}", response_model=UserPublic)
async def get_user(user_id: str):
	user = await user_repo.find_by_id(user_id)
	if not user:
		raise HTTPException(status_code=404, detail="Usuário não encontrado.")
	return {
		"name": user["name"],
		"email": user["email"],
		"role_id": user["role_id"],
	}

@router.get("/email/{email}", response_model=UserPublic)
async def get_user_by_email(email: str):
	user = await user_repo.find_by_email(email)
	if not user:
		raise HTTPException(status_code=404, detail="Usuário não encontrado.")
	return {
		"name": user["name"],
		"email": user["email"],
		"role_id": user["role_id"],
	}
