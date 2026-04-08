import json
import asyncio
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Depends
from pydantic import BaseModel
from typing import Literal
from db import get_pool
from auth import get_current_client, decode_token

router = APIRouter()

STAGES = ["Submitted", "Agent Review", "Claims Dept", "Finance", "Paid"]


class Timestamp(BaseModel):
    stage: str
    ts: str


class Claim(BaseModel):
    claim_id: str
    policy_id: str
    stage: Literal["Submitted", "Agent Review", "Claims Dept", "Finance", "Paid"]
    timestamps: list[Timestamp]
    est_resolution: str
    amount: float
    description: str


def _fmt_claim(row) -> dict:
    d = dict(row)
    for key in ("est_resolution", "created_at"):
        if key in d and hasattr(d[key], "isoformat"):
            d[key] = d[key].isoformat()
    # timestamps is JSONB — asyncpg may return it as a string or list
    ts = d.get("timestamps", [])
    if isinstance(ts, str):
        ts = json.loads(ts)
    d["timestamps"] = ts
    return d


@router.get("/claims", response_model=list[Claim])
async def get_claims(current: dict = Depends(get_current_client)):
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT c.*
            FROM claims c
            JOIN policies p ON c.policy_id = p.policy_id
            WHERE p.client_id = $1
            ORDER BY c.created_at DESC
            """,
            current["sub"],
        )
    return [_fmt_claim(r) for r in rows]


@router.get("/claims/{claim_id}", response_model=Claim)
async def get_claim(claim_id: str, current: dict = Depends(get_current_client)):
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT c.*
            FROM claims c
            JOIN policies p ON c.policy_id = p.policy_id
            WHERE c.claim_id = $1 AND p.client_id = $2
            """,
            claim_id,
            current["sub"],
        )
    if not row:
        raise HTTPException(status_code=404, detail="Claim not found")
    return _fmt_claim(row)


@router.websocket("/ws/claims/{claim_id}")
async def websocket_claim_status(websocket: WebSocket, claim_id: str, token: str = ""):
    """
    Real-time claim stage progression demo.
    Accepts token as a query param: /ws/claims/CLM-001?token=<jwt>
    Advances the claim stage every 8 seconds for the demo.
    """
    await websocket.accept()

    # Verify token passed as query param
    try:
        current = decode_token(token)
    except Exception:
        await websocket.close(code=1008, reason="Unauthorised")
        return

    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT c.claim_id, c.stage
            FROM claims c
            JOIN policies p ON c.policy_id = p.policy_id
            WHERE c.claim_id = $1 AND p.client_id = $2
            """,
            claim_id,
            current["sub"],
        )

    if not row:
        await websocket.close(code=1008, reason="Claim not found")
        return

    try:
        current_stage_idx = STAGES.index(row["stage"])

        await websocket.send_json({"claim_id": claim_id, "stage": row["stage"]})

        while current_stage_idx < len(STAGES) - 1:
            await asyncio.sleep(8)
            current_stage_idx += 1
            new_stage = STAGES[current_stage_idx]
            await websocket.send_json({"claim_id": claim_id, "stage": new_stage})

        # Keep connection alive after reaching Paid
        while True:
            await asyncio.sleep(30)

    except WebSocketDisconnect:
        pass
