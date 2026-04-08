from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import get_pool
from auth import verify_password, create_access_token

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    client_id: str
    name: str
    email: str


@router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT client_id, name, email, password_hash FROM clients WHERE email = $1",
            request.email.lower().strip(),
        )

    if not row or not verify_password(request.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(row["client_id"], row["email"])
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        client_id=row["client_id"],
        name=row["name"],
        email=row["email"],
    )
