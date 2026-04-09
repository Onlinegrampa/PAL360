from datetime import date
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from db import get_pool
from auth import get_current_client

router = APIRouter(prefix="/quotes", tags=["quotes"])

# ── Rate constants (calibrated to real PAL data) ────────────────────────────
# Anchor: Age 57, Female, Non-Smoker, TTD $45,000 = TTD $1,732.80/yr
# => TTD $38.51 per $1,000 of face amount per year
BASE_RATE_PER_1K = 38.51        # TTD/yr per $1,000 face (age 57, female, non-smoker)
BASE_AGE = 57
AGE_FACTOR = 1.09               # 9% increase per year of age above/below base
MALE_LOAD = 1.30                # males pay 30% more
SMOKER_LOAD = 1.65              # smokers pay 65% more
MODAL_MONTHLY = 1.03            # monthly = annual / 12 × 1.03

# ── PA&S tier packages ──────────────────────────────────────────────────────
PA_TIERS = [
    {
        "tier_id": "pa-std",
        "name": "Personal Protector Standard",
        "annual": 780,
        "monthly": round(780 / 12 * MODAL_MONTHLY, 2),
        "description": "Core personal accident protection",
    },
    {
        "tier_id": "pa-plus",
        "name": "Personal Protector Plus",
        "annual": 1560,
        "monthly": round(1560 / 12 * MODAL_MONTHLY, 2),
        "description": "Enhanced cover with additional benefits",
    },
    {
        "tier_id": "pa-total",
        "name": "Total Protector",
        "annual": 1620,
        "monthly": round(1620 / 12 * MODAL_MONTHLY, 2),
        "description": "Comprehensive all-in-one protection package",
    },
]


class QuoteInput(BaseModel):
    product_line: str           # "Life", "Health", "Annuities", "PA&S"
    coverage_amount: float = 0  # face amount for Life / Health
    pa_tier_id: str = ""        # for PA&S
    sex: str = "F"              # "M" or "F"
    smoker: bool = False
    date_of_birth: str = ""     # YYYY-MM-DD — overrides fact-find age when provided


def _age_from_dob(dob_str: str) -> int:
    """Calculate age in whole years from a YYYY-MM-DD date string."""
    dob = date.fromisoformat(dob_str)
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _life_annual(age: int, sex: str, smoker: bool, coverage: float) -> float:
    """Calculate annual life premium using age-adjusted rate."""
    rate = BASE_RATE_PER_1K * (AGE_FACTOR ** (age - BASE_AGE))
    if sex.upper() == "M":
        rate *= MALE_LOAD
    if smoker:
        rate *= SMOKER_LOAD
    return round(rate * (coverage / 1000), 2)


@router.get("/pa-tiers")
def get_pa_tiers():
    """Return PA&S package tier pricing — no auth required."""
    return PA_TIERS


@router.post("/calculate")
async def calculate_quote(
    data: QuoteInput,
    current: dict = Depends(get_current_client),
):
    """
    Calculate an indicative premium quote.
    Age source priority: date_of_birth in request > fact-find record.
    """
    # ── Resolve age ──────────────────────────────────────────────────────────
    age: int | None = None

    if data.date_of_birth:
        try:
            age = _age_from_dob(data.date_of_birth)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid date of birth format. Use YYYY-MM-DD.")
        if age < 18 or age > 80:
            raise HTTPException(status_code=422, detail="Age must be between 18 and 80 to quote.")
    else:
        # Fall back to the client's saved fact-find
        client_id = current["sub"]
        pool = get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT age FROM fact_finds WHERE client_id = $1 AND is_current = true",
                client_id,
            )
        if row and row["age"]:
            age = row["age"]

    if age is None:
        raise HTTPException(
            status_code=422,
            detail="Please enter your date of birth to calculate a quote.",
        )

    # ── Life ────────────────────────────────────────────────────────────────
    if data.product_line == "Life":
        if data.coverage_amount <= 0:
            raise HTTPException(status_code=422, detail="Coverage amount must be greater than 0.")
        annual = _life_annual(age, data.sex, data.smoker, data.coverage_amount)
        monthly = round(annual / 12 * MODAL_MONTHLY, 2)
        rate_per_1k = round(BASE_RATE_PER_1K * (AGE_FACTOR ** (age - BASE_AGE))
                            * (MALE_LOAD if data.sex.upper() == "M" else 1.0)
                            * (SMOKER_LOAD if data.smoker else 1.0), 4)
        return {
            "product_line": "Life",
            "age": age,
            "sex": data.sex,
            "smoker": data.smoker,
            "coverage_amount": data.coverage_amount,
            "annual": annual,
            "monthly": monthly,
            "rate_per_1k": rate_per_1k,
        }

    # ── PA&S ────────────────────────────────────────────────────────────────
    elif data.product_line == "PA&S":
        if not data.pa_tier_id:
            raise HTTPException(status_code=422, detail="Please select a PA&S package tier.")
        tier = next((t for t in PA_TIERS if t["tier_id"] == data.pa_tier_id), None)
        if not tier:
            raise HTTPException(status_code=422, detail="Invalid PA&S tier selected.")
        return {
            "product_line": "PA&S",
            "age": age,
            "tier_id": tier["tier_id"],
            "name": tier["name"],
            "annual": tier["annual"],
            "monthly": tier["monthly"],
        }

    # ── Health ──────────────────────────────────────────────────────────────
    elif data.product_line == "Health":
        # Age-banded flat estimate
        if age < 30:
            annual = 1_800
        elif age < 45:
            annual = 2_400
        elif age < 55:
            annual = 3_600
        else:
            annual = 4_800
        if data.smoker:
            annual = round(annual * 1.25)
        monthly = round(annual / 12 * MODAL_MONTHLY, 2)
        return {
            "product_line": "Health",
            "age": age,
            "annual": float(annual),
            "monthly": monthly,
            "note": "Estimated range — final premium determined after medical underwriting.",
        }

    # ── Annuities ───────────────────────────────────────────────────────────
    elif data.product_line == "Annuities":
        return {
            "product_line": "Annuities",
            "age": age,
            "annual": 0,
            "monthly": 0,
            "note": "Annuity illustrations are personalised. An advisor will contact you.",
        }

    else:
        raise HTTPException(status_code=422, detail=f"Unknown product line: {data.product_line}")
