import json
import asyncio
from pathlib import Path
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from typing import Literal

router = APIRouter()

SEEDS_DIR = Path(__file__).parent.parent / "data" / "seeds"

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


def _load_claims() -> list[dict]:
    path = SEEDS_DIR / "claims.json"
    if not path.exists():
        return []
    return json.loads(path.read_text())


@router.get("/claims", response_model=list[Claim])
def get_claims():
    return _load_claims()


@router.get("/claims/{claim_id}", response_model=Claim)
def get_claim(claim_id: str):
    for c in _load_claims():
        if c["claim_id"] == claim_id:
            return c
    raise HTTPException(status_code=404, detail="Claim not found")


@router.websocket("/ws/claims/{claim_id}")
async def websocket_claim_status(websocket: WebSocket, claim_id: str):
    """
    Simulates real-time claim stage progression for demo purposes.
    Advances the claim stage every 8 seconds until Paid.
    """
    await websocket.accept()

    claims = _load_claims()
    claim = next((c for c in claims if c["claim_id"] == claim_id), None)

    if not claim:
        await websocket.close(code=1008, reason="Claim not found")
        return

    try:
        current_stage_idx = STAGES.index(claim["stage"])

        # Send current state immediately
        await websocket.send_json({
            "claim_id": claim_id,
            "stage": claim["stage"],
        })

        # Simulate progression for demo
        while current_stage_idx < len(STAGES) - 1:
            await asyncio.sleep(8)
            current_stage_idx += 1
            new_stage = STAGES[current_stage_idx]

            await websocket.send_json({
                "claim_id": claim_id,
                "stage": new_stage,
            })

        # Keep connection alive after reaching Paid
        while True:
            await asyncio.sleep(30)

    except WebSocketDisconnect:
        pass
