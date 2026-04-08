import os
import uuid
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from db import get_pool
from auth import get_current_client

router = APIRouter()


class PaymentRequest(BaseModel):
    policy_id: str
    amount: float
    cardholder_name: str
    card_number: str      # masked/placeholder — never stored
    expiry: str
    cvv: str              # never stored


class PaymentResponse(BaseModel):
    success: bool
    transaction_id: str
    amount_charged: float
    message: str


@router.post("/payment", response_model=PaymentResponse)
async def process_payment(
    request: PaymentRequest,
    current: dict = Depends(get_current_client),
):
    """
    WiPay payment placeholder.
    Demo mode: always returns success and records the transaction.
    Live mode: uncomment WiPay block when WIPAY_ACCOUNT_NUMBER is set.
    """
    wipay_account = os.getenv("WIPAY_ACCOUNT_NUMBER", "")

    if wipay_account:
        # ── LIVE WIPAY BLOCK (activate after business registration) ──────────
        # import httpx
        # wipay_key = os.getenv("WIPAY_API_KEY", "")
        # async with httpx.AsyncClient() as client:
        #     resp = await client.post(
        #         "https://wipayfinancial.com/plugins/payments/request",
        #         data={
        #             "account_number": wipay_account,
        #             "avs": 0,
        #             "card_number": request.card_number,
        #             "card_expiry": request.expiry,
        #             "card_cvv": request.cvv,
        #             "cardholder": request.cardholder_name,
        #             "total": str(request.amount),
        #             "currency": "TTD",
        #         }
        #     )
        # ── end WiPay block ──────────────────────────────────────────────────
        pass

    # Simulation mode — always succeeds for demo
    transaction_id = f"WIPAY-{uuid.uuid4().hex[:10].upper()}"

    pool = get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO payments (payment_id, policy_id, amount, wipay_ref, status)
            VALUES ($1, $2, $3, $4, 'succeeded')
            """,
            f"PAY-{uuid.uuid4().hex[:8].upper()}",
            request.policy_id,
            request.amount,
            transaction_id,
        )

    return PaymentResponse(
        success=True,
        transaction_id=transaction_id,
        amount_charged=request.amount,
        message="Payment confirmed — demo mode",
    )
