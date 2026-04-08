from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Literal
from db import get_pool
from auth import get_current_client

router = APIRouter()


class Policy(BaseModel):
    policy_id: str
    client_id: str
    line: Literal["Life", "Health", "Annuities", "PA&S"]
    status: Literal["IN-FORCE", "LAPSED", "PENDING"]
    premium: float
    due_date: str
    coverage_amount: float
    start_date: str


def _fmt_row(row) -> dict:
    d = dict(row)
    for key in ("due_date", "start_date", "created_at"):
        if key in d and hasattr(d[key], "isoformat"):
            d[key] = d[key].isoformat()
    return d


@router.get("/policies", response_model=list[Policy])
async def get_policies(current: dict = Depends(get_current_client)):
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM policies WHERE client_id = $1 ORDER BY start_date",
            current["sub"],
        )
    return [_fmt_row(r) for r in rows]


@router.get("/policies/{policy_id}", response_model=Policy)
async def get_policy(policy_id: str, current: dict = Depends(get_current_client)):
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM policies WHERE policy_id = $1 AND client_id = $2",
            policy_id,
            current["sub"],
        )
    if not row:
        raise HTTPException(status_code=404, detail="Policy not found")
    return _fmt_row(row)
