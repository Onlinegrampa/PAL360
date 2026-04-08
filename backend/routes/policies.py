import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal

router = APIRouter()

SEEDS_DIR = Path(__file__).parent.parent / "data" / "seeds"


class Policy(BaseModel):
    policy_id: str
    client_id: str
    line: Literal["Life", "Health", "Annuities", "PA&S"]
    status: Literal["IN-FORCE", "LAPSED", "PENDING"]
    premium: float
    due_date: str
    coverage_amount: float
    start_date: str


def _load_policies() -> list[dict]:
    path = SEEDS_DIR / "policies.json"
    if not path.exists():
        return []
    return json.loads(path.read_text())


@router.get("/policies", response_model=list[Policy])
def get_policies():
    data = _load_policies()
    return data


@router.get("/policies/{policy_id}", response_model=Policy)
def get_policy(policy_id: str):
    data = _load_policies()
    for p in data:
        if p["policy_id"] == policy_id:
            return p
    raise HTTPException(status_code=404, detail="Policy not found")
