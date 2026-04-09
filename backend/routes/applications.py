import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from db import get_pool
from auth import get_current_client

router = APIRouter(prefix="/applications", tags=["applications"])


class ApplicationInput(BaseModel):
    product_id: str
    product_name: str
    full_name: str
    date_of_birth: str
    address: str
    phone: str
    occupation: str
    sex: str = "F"
    smoker: bool
    pre_existing_conditions: str
    beneficiary_name: str
    beneficiary_relationship: str
    beneficiary_phone: str
    signature: str = ""      # base64 PNG data URI from canvas pad


def _fmt(row: dict) -> dict:
    r = dict(row)
    r["created_at"] = r["created_at"].isoformat()
    return r


@router.post("")
async def submit_application(
    data: ApplicationInput,
    current: dict = Depends(get_current_client),
):
    """Submit a new insurance application."""
    client_id = current["sub"]
    app_ref = f"APP-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO applications
              (app_ref, client_id, product_id, product_name, full_name, date_of_birth,
               address, phone, occupation, sex, smoker, pre_existing_conditions,
               beneficiary_name, beneficiary_relationship, beneficiary_phone,
               signature, status)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'under_review')
            RETURNING *
            """,
            app_ref, client_id, data.product_id, data.product_name,
            data.full_name, data.date_of_birth, data.address, data.phone,
            data.occupation, data.sex, data.smoker, data.pre_existing_conditions,
            data.beneficiary_name, data.beneficiary_relationship, data.beneficiary_phone,
            data.signature or None,
        )
    return _fmt(dict(row))


@router.get("")
async def get_my_applications(current: dict = Depends(get_current_client)):
    """Return all applications for the logged-in client."""
    client_id = current["sub"]
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM applications WHERE client_id = $1 ORDER BY created_at DESC",
            client_id,
        )
    return [_fmt(dict(r)) for r in rows]
