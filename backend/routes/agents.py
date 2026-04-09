from fastapi import APIRouter, Depends
from pydantic import BaseModel
from db import get_pool
from auth import get_current_client

router = APIRouter(prefix="/agents", tags=["agents"])


class AgentRequestInput(BaseModel):
    agent_id: str
    message: str = ""


def _fmt_agent(row: dict) -> dict:
    r = dict(row)
    if "created_at" in r and r["created_at"]:
        r["created_at"] = r["created_at"].isoformat()
    return r


@router.get("")
async def list_agents():
    """Return all active agents (no auth required — shown to new clients)."""
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM agents WHERE is_active = true ORDER BY name"
        )
    return [_fmt_agent(dict(r)) for r in rows]


@router.post("/request")
async def request_agent(
    data: AgentRequestInput,
    current: dict = Depends(get_current_client),
):
    """Client requests to be assigned to a specific agent."""
    client_id = current["sub"]
    pool = get_pool()
    async with pool.acquire() as conn:
        # Upsert: one request per client (replace if they change their mind)
        await conn.execute(
            """
            INSERT INTO agent_requests (client_id, agent_id, message)
            VALUES ($1, $2, $3)
            ON CONFLICT (client_id)
            DO UPDATE SET agent_id = EXCLUDED.agent_id,
                          message   = EXCLUDED.message,
                          status    = 'pending',
                          created_at = NOW()
            """,
            client_id, data.agent_id, data.message,
        )
        # Fetch the agent name for the response
        agent = await conn.fetchrow(
            "SELECT name FROM agents WHERE agent_id = $1", data.agent_id
        )
    return {
        "success": True,
        "message": f"Your request to connect with {agent['name'] if agent else 'the agent'} has been sent.",
    }
