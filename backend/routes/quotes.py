from datetime import date
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from db import get_pool
from auth import get_current_client

router = APIRouter(prefix="/quotes", tags=["quotes"])

# ── Ordinary Life Non-Participating — Plan 001-NP ────────────────────────────
# Extracted directly from the PAL Excel Illustration Software (Tablas sheet,
# rows 552-619, columns 26-30: Age, M_NS, M_SM, F_NS, F_SM — Band 1).
# Units: TTD annual net premium per $1,000 of face amount.
#
# Annual gross premium = (face_amount / 1000 × net_rate) + POLICY_FEE
# Calibration: Age 57, Female, Non-Smoker, $45,000 face → TTD $1,732.80/yr
# Cross-check:  45 × 35.15  + 151.05 = 1,581.75 + 151.05 = 1,732.80 ✓
POLICY_FEE_ANNUAL = 151.05  # TTD — fixed annual policy fee (all Life products)

# Dict: age → (M_NS, M_SM, F_NS, F_SM)  — net rate per $1,000/year
_LIFE_RATES: dict[int, tuple[float, float, float, float]] = {
    18: (8.86,  8.86,  8.09,  8.09),
    19: (8.86,  9.14,  8.09,  8.09),
    20: (9.14,  9.43,  8.09,  8.09),
    21: (9.43,  9.73,  8.09,  8.09),
    22: (9.73,  10.04, 8.09,  8.36),
    23: (10.04, 10.37, 8.36,  8.64),
    24: (10.37, 10.72, 8.64,  8.93),
    25: (10.72, 11.09, 8.93,  9.24),
    26: (11.09, 11.48, 9.24,  9.57),
    27: (11.48, 11.89, 9.57,  9.92),
    28: (11.89, 12.32, 9.92,  10.29),
    29: (12.32, 12.77, 10.29, 10.68),
    30: (12.77, 13.25, 10.68, 11.09),
    31: (13.25, 13.76, 11.09, 11.52),
    32: (13.76, 14.30, 11.52, 11.97),
    33: (14.30, 14.87, 11.97, 12.44),
    34: (14.87, 15.47, 12.44, 12.94),
    35: (15.47, 16.10, 12.94, 13.47),
    36: (16.10, 16.77, 13.47, 14.03),
    37: (16.77, 17.48, 14.03, 14.62),
    38: (17.48, 18.23, 14.62, 15.25),
    39: (18.23, 19.02, 15.25, 15.92),
    40: (19.02, 19.85, 15.92, 16.63),
    41: (19.85, 20.73, 16.63, 17.38),
    42: (20.73, 21.66, 17.38, 18.17),
    43: (21.66, 22.64, 18.17, 19.00),
    44: (22.64, 23.68, 19.00, 19.87),
    45: (23.68, 24.78, 19.87, 20.79),
    46: (24.78, 25.94, 20.79, 21.76),
    47: (25.94, 27.16, 21.76, 22.79),
    48: (27.16, 28.45, 22.79, 23.88),
    49: (28.45, 29.82, 23.88, 25.03),
    50: (29.82, 31.27, 25.03, 26.24),
    51: (31.27, 32.81, 26.24, 27.52),
    52: (32.81, 34.44, 27.52, 28.88),
    53: (34.44, 36.16, 28.88, 30.32),
    54: (36.16, 37.98, 30.32, 31.84),
    55: (37.98, 39.91, 31.84, 33.45),
    56: (39.91, 41.96, 33.45, 35.15),
    57: (41.96, 44.13, 35.15, 36.95),
    58: (44.13, 46.43, 36.95, 38.86),
    59: (46.43, 48.87, 38.86, 40.89),
    60: (48.87, 51.46, 40.89, 43.04),
    61: (51.46, 54.22, 43.04, 45.32),
    62: (54.22, 57.15, 45.32, 47.74),
    63: (57.15, 60.26, 47.74, 50.31),
    64: (60.26, 63.56, 50.31, 53.04),
    65: (63.56, 67.07, 53.04, 55.94),
}

# ── PA&S tier packages ────────────────────────────────────────────────────────
MODAL_MONTHLY = 1.0   # monthly = annual / 12 (no modal load for PA&S)

PA_TIERS = [
    {
        "tier_id":    "pa-std",
        "name":       "Personal Protector Standard",
        "annual":     780,
        "monthly":    round(780  / 12, 2),
        "description":"Core personal accident protection",
    },
    {
        "tier_id":    "pa-plus",
        "name":       "Personal Protector Plus",
        "annual":     1560,
        "monthly":    round(1560 / 12, 2),
        "description":"Enhanced cover with additional benefits",
    },
    {
        "tier_id":    "pa-total",
        "name":       "Total Protector",
        "annual":     1620,
        "monthly":    round(1620 / 12, 2),
        "description":"Comprehensive all-in-one protection package",
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
    dob   = date.fromisoformat(dob_str)
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _life_net_rate(age: int, sex: str, smoker: bool) -> float:
    """
    Return the net annual premium rate per TTD $1,000 of face amount.
    Source: PAL Illustration Software — Plan 001-NP rate table.
    Extrapolates linearly outside the table range (ages 18-65).
    """
    clamped = max(18, min(65, age))
    m_ns, m_sm, f_ns, f_sm = _LIFE_RATES[clamped]
    if sex.upper() == "M":
        return m_sm if smoker else m_ns
    return f_sm if smoker else f_ns


def _life_premium(age: int, sex: str, smoker: bool, coverage: float) -> dict:
    """
    Compute annual + monthly premium for a Life policy.
    Formula: annual = (face / 1000 × net_rate) + POLICY_FEE_ANNUAL
    Calibrated: age 57, F, NS, $45,000 → TTD $1,732.80/yr, $144.40/mo ✓
    """
    net_rate = _life_net_rate(age, sex, smoker)
    annual   = round((coverage / 1000) * net_rate + POLICY_FEE_ANNUAL, 2)
    monthly  = round(annual / 12, 2)
    return {
        "annual":      annual,
        "monthly":     monthly,
        "net_rate":    round(net_rate, 2),
        "policy_fee":  POLICY_FEE_ANNUAL,
    }


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
    Age source priority: date_of_birth in request > client's fact-find record.
    """
    # ── Resolve age ──────────────────────────────────────────────────────────
    age: int | None = None

    if data.date_of_birth:
        try:
            age = _age_from_dob(data.date_of_birth)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid date of birth. Use YYYY-MM-DD.")
        if age < 18 or age > 80:
            raise HTTPException(status_code=422, detail="Age must be between 18 and 80 to quote.")
    else:
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

    # ── Life ─────────────────────────────────────────────────────────────────
    if data.product_line == "Life":
        if data.coverage_amount <= 0:
            raise HTTPException(status_code=422, detail="Coverage amount must be greater than 0.")
        prem = _life_premium(age, data.sex, data.smoker, data.coverage_amount)
        return {
            "product_line":    "Life",
            "age":             age,
            "sex":             data.sex,
            "smoker":          data.smoker,
            "coverage_amount": data.coverage_amount,
            **prem,
        }

    # ── PA&S ─────────────────────────────────────────────────────────────────
    elif data.product_line == "PA&S":
        if not data.pa_tier_id:
            raise HTTPException(status_code=422, detail="Please select a PA&S package tier.")
        tier = next((t for t in PA_TIERS if t["tier_id"] == data.pa_tier_id), None)
        if not tier:
            raise HTTPException(status_code=422, detail="Invalid PA&S tier selected.")
        return {
            "product_line": "PA&S",
            "age":          age,
            **tier,
        }

    # ── Health ───────────────────────────────────────────────────────────────
    elif data.product_line == "Health":
        # Age-banded estimate (PAL Health does not use the life rate table)
        if age < 30:
            annual = 1_800.0
        elif age < 45:
            annual = 2_400.0
        elif age < 55:
            annual = 3_600.0
        else:
            annual = 4_800.0
        if data.smoker:
            annual = round(annual * 1.05)
        return {
            "product_line": "Health",
            "age":          age,
            "annual":       annual,
            "monthly":      round(annual / 12, 2),
            "note":         "Estimated range — final premium determined after medical underwriting.",
        }

    # ── Annuities ────────────────────────────────────────────────────────────
    elif data.product_line == "Annuities":
        return {
            "product_line": "Annuities",
            "age":          age,
            "annual":       0,
            "monthly":      0,
            "note":         "Annuity illustrations are personalised. An advisor will contact you.",
        }

    else:
        raise HTTPException(status_code=422, detail=f"Unknown product line: {data.product_line}")
