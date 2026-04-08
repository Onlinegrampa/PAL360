import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class PaymentRequest(BaseModel):
    payment_method_id: str
    amount_cents: int


class PaymentResponse(BaseModel):
    success: bool
    transaction_id: str
    amount_charged: int
    message: str


@router.post("/payment", response_model=PaymentResponse)
def process_payment(request: PaymentRequest):
    """
    Test-mode payment processing via Stripe.
    In simulation mode, always returns success.
    """
    stripe_key = os.getenv("STRIPE_SECRET_KEY", "")

    if stripe_key and stripe_key.startswith("sk_test_"):
        import stripe
        stripe.api_key = stripe_key

        try:
            intent = stripe.PaymentIntent.create(
                amount=request.amount_cents,
                currency="usd",
                payment_method=request.payment_method_id,
                confirm=True,
                automatic_payment_methods={"enabled": True, "allow_redirects": "never"},
            )
            return PaymentResponse(
                success=True,
                transaction_id=intent.id,
                amount_charged=request.amount_cents,
                message="Payment confirmed",
            )
        except stripe.error.CardError as e:
            raise HTTPException(status_code=402, detail=str(e.user_message))
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=500, detail="Payment processing error")

    # Simulation mode (no Stripe key configured)
    import uuid
    return PaymentResponse(
        success=True,
        transaction_id=f"sim_{uuid.uuid4().hex[:12]}",
        amount_charged=request.amount_cents,
        message="Payment confirmed (simulation mode)",
    )
