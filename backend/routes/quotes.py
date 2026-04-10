from datetime import date
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from db import get_pool
from auth import get_current_client
from routes.pa_rates import (
    RATES_60A, RATES_61A, RATES_62, RATES_68A, EP_LABELS,
    RATES_67C, RATES_67D, RATES_77B,
    RATES_78C, RATES_69L, RATES_CI,
    RATES_CANCER_CARE, CANCER_CARE_CHILD_RIDER, RATE_CANCER_CARE_PLUS_C,
    RATES_TOTAL_PROTECTOR, RATES_SUPER_FAMILY,
    RATES_PP_MALE, RATES_PP_FEMALE,
    RATES_LS_STANDARD, RATES_LS_ENHANCED,
    RATES_SUPREME_SINGLE, RATES_SUPREME_FAMILY,
    _age_band,
)
from routes.cash_values import get_cash_values
from routes.plan_rates import (
    RATES_001P, RATES_001NP,
    RATES_002P, RATES_002NP,
    RATES_005P, RATES_005NP,
    RATES_010P, RATES_010NP,
    RATES_015P, RATES_015NP,
    RATES_020P, RATES_020NP,
    RATES_025P, RATES_025NP,
    RATES_026P, RATES_026NP,
    RATES_027P, RATES_027NP,
    RATES_028P, RATES_032P,
    RATES_052, RATES_056, RATES_058,
    RATES_094, RATES_164, RATES_201,
    RATES_074, RATES_075, RATES_076,
    RATES_077, RATES_078, RATES_168, RATES_170,
    RATES_T80S, RATES_T80H,
    RATES_361, RATES_362, RATES_363,
    RATES_365, RATES_366, RATES_367,
    RATES_818, ESP_DURATIONS,
)

router = APIRouter(prefix="/quotes", tags=["quotes"])

# ── Fixed policy fee ──────────────────────────────────────────────────────────
# TTD annual policy fee — all individual Life products.
# Calibration: Age 57, Female, Non-Smoker, $45,000 face
#   → (45 × 35.15) + 151.05 = 1,732.80/yr, 144.40/mo  ✓
POLICY_FEE_ANNUAL = 151.05

# ── Plan registry ─────────────────────────────────────────────────────────────
# plan_type:
#   "life"   — standard M/F × NS/SM rate table (cols: M_NS, M_SM, F_NS, F_SM)
#   "unisex" — single flat rate (Silver Lining plans, no sex/smoker distinction)
#   "esp"    — Education Security Plan (payor_age × duration lookup)
#
# min_age / max_age — quoting age limits from the rate table.
# name — display name matching the PAL Excel Illustration Software.

PLAN_REGISTRY: dict[str, dict] = {
    # ── Ordinary Life ──────────────────────────────────────────────────────────
    "001-P":  {"type": "life",   "rates": RATES_001P,  "min_age": 0,  "max_age": 65, "name": "Ordinary Life - Participating"},
    "001-NP": {"type": "life",   "rates": RATES_001NP, "min_age": 10, "max_age": 65, "name": "Ordinary Life - Non-Participating"},

    # ── Limited-Pay Life ───────────────────────────────────────────────────────
    "002-P":  {"type": "life",   "rates": RATES_002P,  "min_age": 0,  "max_age": 55, "name": "20-Pay Life - Participating"},
    "002-NP": {"type": "life",   "rates": RATES_002NP, "min_age": 0,  "max_age": 55, "name": "20-Pay Life - Non-Participating"},
    "005-P":  {"type": "life",   "rates": RATES_005P,  "min_age": 0,  "max_age": 55, "name": "15-Pay Life - Participating"},
    "005-NP": {"type": "life",   "rates": RATES_005NP, "min_age": 0,  "max_age": 55, "name": "15-Pay Life - Non-Participating"},
    "010-P":  {"type": "life",   "rates": RATES_010P,  "min_age": 0,  "max_age": 65, "name": "10-Pay Life - Participating"},
    "010-NP": {"type": "life",   "rates": RATES_010NP, "min_age": 0,  "max_age": 65, "name": "10-Pay Life - Non-Participating"},
    "028-P":  {"type": "life",   "rates": RATES_028P,  "min_age": 0,  "max_age": 8,  "name": "Life Paid Up at 65"},

    # ── Endowment Plans ────────────────────────────────────────────────────────
    "015-P":  {"type": "life",   "rates": RATES_015P,  "min_age": 0,  "max_age": 65, "name": "15-Year Endowment - Participating"},
    "015-NP": {"type": "life",   "rates": RATES_015NP, "min_age": 0,  "max_age": 65, "name": "15-Year Endowment - Non-Participating"},
    "020-P":  {"type": "life",   "rates": RATES_020P,  "min_age": 0,  "max_age": 65, "name": "20-Year Endowment - Participating"},
    "020-NP": {"type": "life",   "rates": RATES_020NP, "min_age": 0,  "max_age": 65, "name": "20-Year Endowment - Non-Participating"},
    "025-P":  {"type": "life",   "rates": RATES_025P,  "min_age": 0,  "max_age": 45, "name": "25-Year Endowment - Participating"},
    "025-NP": {"type": "life",   "rates": RATES_025NP, "min_age": 0,  "max_age": 45, "name": "25-Year Endowment - Non-Participating"},
    "026-P":  {"type": "life",   "rates": RATES_026P,  "min_age": 0,  "max_age": 50, "name": "30-Year Endowment - Participating"},
    "026-NP": {"type": "life",   "rates": RATES_026NP, "min_age": 0,  "max_age": 50, "name": "30-Year Endowment - Non-Participating"},
    "027-P":  {"type": "life",   "rates": RATES_027P,  "min_age": 0,  "max_age": 55, "name": "Endowment to Age 65 - Participating"},
    "027-NP": {"type": "life",   "rates": RATES_027NP, "min_age": 0,  "max_age": 55, "name": "Endowment to Age 65 - Non-Participating"},
    "032-P":  {"type": "life",   "rates": RATES_032P,  "min_age": 0,  "max_age": 9,  "name": "Endowment at 55"},

    # ── Term Plans ─────────────────────────────────────────────────────────────
    "052":    {"type": "life",   "rates": RATES_052,   "min_age": 20, "max_age": 60, "name": "5-Year Term"},
    "056":    {"type": "life",   "rates": RATES_056,   "min_age": 20, "max_age": 70, "name": "10-Year Term"},
    "058":    {"type": "life",   "rates": RATES_058,   "min_age": 20, "max_age": 70, "name": "20-Year Term"},
    "T80S":   {"type": "life",   "rates": RATES_T80S,  "min_age": 20, "max_age": 70, "name": "Term to Age 80 - Standard Band"},
    "T80H":   {"type": "life",   "rates": RATES_T80H,  "min_age": 20, "max_age": 70, "name": "Term to Age 80 - High Band"},

    # ── Level Term Riders ──────────────────────────────────────────────────────
    "076":    {"type": "life",   "rates": RATES_076,   "min_age": 20, "max_age": 55, "name": "10-Year Level Term Rider"},
    "077":    {"type": "life",   "rates": RATES_077,   "min_age": 20, "max_age": 50, "name": "15-Year Level Term Rider"},
    "078":    {"type": "life",   "rates": RATES_078,   "min_age": 20, "max_age": 45, "name": "20-Year Level Term Rider"},
    "170":    {"type": "life",   "rates": RATES_170,   "min_age": 20, "max_age": 40, "name": "25-Year Level Term Rider"},
    "168":    {"type": "life",   "rates": RATES_168,   "min_age": 20, "max_age": 50, "name": "Level Term Rider to Age 55"},
    "074":    {"type": "life",   "rates": RATES_074,   "min_age": 20, "max_age": 55, "name": "Level Term Rider to Age 60"},
    "075":    {"type": "life",   "rates": RATES_075,   "min_age": 20, "max_age": 60, "name": "Level Term Rider to Age 65"},

    # ── Silver Lining (Return-of-Premium Term) ─────────────────────────────────
    "361":    {"type": "unisex", "rates": RATES_361,   "min_age": 20, "max_age": 55, "name": "10-Year Silver Lining"},
    "362":    {"type": "unisex", "rates": RATES_362,   "min_age": 20, "max_age": 50, "name": "15-Year Silver Lining"},
    "363":    {"type": "unisex", "rates": RATES_363,   "min_age": 20, "max_age": 45, "name": "20-Year Silver Lining"},
    "365":    {"type": "unisex", "rates": RATES_365,   "min_age": 20, "max_age": 45, "name": "Silver Lining to Age 55"},
    "366":    {"type": "unisex", "rates": RATES_366,   "min_age": 20, "max_age": 50, "name": "Silver Lining to Age 60"},
    "367":    {"type": "unisex", "rates": RATES_367,   "min_age": 20, "max_age": 55, "name": "Silver Lining to Age 65"},

    # ── Education Security Plan ────────────────────────────────────────────────
    "818":    {"type": "esp",    "rates": RATES_818,   "min_age": 20, "max_age": 60, "name": "Education Security Plan"},

    # ── Specialty Plans ────────────────────────────────────────────────────────
    "094":    {"type": "life",   "rates": RATES_094,   "min_age": 10, "max_age": 65, "name": "Plan 094"},
    "164":    {"type": "life",   "rates": RATES_164,   "min_age": 20, "max_age": 55, "name": "Plan 164"},
    "201":    {"type": "life",   "rates": RATES_201,   "min_age": 18, "max_age": 70, "name": "Plan 201-202"},
}

# ── PA&S plan registry ────────────────────────────────────────────────────────
PA_REGISTRY: dict[str, dict] = {
    "60A":     {"name": "Accidental Death and Dismemberment",               "type": "pa_add"},
    "61A":     {"name": "Accident Medical Expense Reimbursement",           "type": "pa_med"},
    "62A":     {"name": "Accident Disability Income - 52 Weeks",            "type": "pa_di_acc"},
    "62B":     {"name": "Accident Disability Income - 104 Weeks",           "type": "pa_di_acc"},
    "67C":     {"name": "A&S In-Hospital Income + Convalescent Care",       "type": "pa_hospital"},
    "67D":     {"name": "A&S In-Hospital Income without Convalescent Care", "type": "pa_hospital"},
    "68A":     {"name": "A&S Disability Income - 104 Weeks",               "type": "pa_as_di"},
    "77B":     {"name": "Accident and Sickness In-Hospital Surgical Expense","type": "pa_surgical"},
    "78C":     {"name": "Accident Annuity - AD&D with PTD",                "type": "pa_annuity"},
    "69L":     {"name": "Level Term Life",                                  "type": "pa_term"},
    "CI":      {"name": "Critical Illness Cover",                           "type": "pa_ci"},
    "PP":      {"name": "Personal Protector",                              "type": "pa_pp"},
    "TP":      {"name": "Total Protector",                                 "type": "pa_tp"},
    "SFP":     {"name": "Super Family Protector",                          "type": "pa_sfp"},
    "SFP-SP":  {"name": "Supreme Family Protector - Single Parent",        "type": "pa_supreme"},
    "SFP-FG":  {"name": "Supreme Family Protector - Family Group",         "type": "pa_supreme"},
    "CCP-C":   {"name": "Cancer Care Plus - Plan C: Standard Care",        "type": "pa_ccp"},
    "CC-A":    {"name": "Cancer Care Cover - Plan A: Essential Shield Cover","type": "pa_cc"},
    "CC-B":    {"name": "Cancer Care Cover - Plan B: Premiere Guard Cover", "type": "pa_cc"},
    "CC-C":    {"name": "Cancer Care Cover - Plan C: Elite Armour Cover",   "type": "pa_cc"},
    "LS-STD":  {"name": "Life Support - Standard Option",                  "type": "pa_ls"},
    "LS-ENH":  {"name": "Life Support - Enhanced Option",                  "type": "pa_ls"},
    "IS":      {"name": "Income Shield",                                   "type": "pa_is"},
}

# Legacy tiers kept for backward compat
PA_TIERS: list[dict] = []


class QuoteInput(BaseModel):
    product_line: str             # "Life", "Health", "Annuities", "PA&S"
    plan_code: str = ""           # e.g. "001-NP", "361", "818", "60A", "PP" …
    coverage_amount: float = 0    # face amount / benefit amount (TTD)
    pa_tier_id: str = ""          # legacy PA&S tier (deprecated)
    sex: str = "F"                # "M" or "F"
    smoker: bool = False
    date_of_birth: str = ""       # YYYY-MM-DD
    esp_duration: int = 0         # ESP only: plan duration in years (10–25)
    # PA&S-specific
    occ_class: int = 1            # occupation class 1–4
    plan_tier: str = ""           # Platinum/Gold/Silver | I/II/III/IV | A/B/C
    coverage_type: str = "Individual"  # Individual | Single_Parent | Husband_Wife | Full_Family
    ep_code: str = "G_30S_14A"   # elimination period code for A&S DI 68A


def _age_from_dob(dob_str: str) -> int:
    dob   = date.fromisoformat(dob_str)
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _life_rate(plan_code: str, age: int, sex: str, smoker: bool) -> float:
    """Look up net rate per $1,000 from the plan's rate table (Band 1)."""
    cfg = PLAN_REGISTRY[plan_code]
    plan_type = cfg["type"]
    rates = cfg["rates"]

    if plan_type == "unisex":
        # Silver Lining — single rate for all
        clamped = max(cfg["min_age"], min(cfg["max_age"], age))
        rate = rates.get(clamped)
        if rate is None:
            raise ValueError(f"No rate for age {age} in plan {plan_code}")
        return float(rate)

    # Standard M/F × NS/SM table: (M_NS, M_SM, F_NS, F_SM)
    clamped = max(cfg["min_age"], min(cfg["max_age"], age))
    entry = rates.get(clamped)
    if entry is None:
        raise ValueError(f"No rate for age {age} in plan {plan_code}")
    m_ns, m_sm, f_ns, f_sm = entry
    if sex.upper() == "M":
        return m_sm if smoker else m_ns
    return f_sm if smoker else f_ns


def _life_premium(plan_code: str, age: int, sex: str, smoker: bool,
                  coverage: float) -> dict:
    """Annual + monthly premium for a standard or Silver Lining life plan."""
    net_rate = _life_rate(plan_code, age, sex, smoker)
    annual   = round((coverage / 1000) * net_rate + POLICY_FEE_ANNUAL, 2)
    monthly  = round(annual / 12, 2)
    return {
        "annual":     annual,
        "monthly":    monthly,
        "net_rate":   round(net_rate, 2),
        "policy_fee": POLICY_FEE_ANNUAL,
    }


def _esp_premium(age: int, duration: int, coverage: float) -> dict:
    """Annual + monthly premium for Education Security Plan."""
    payor_rates = RATES_818.get(age)
    if payor_rates is None:
        raise ValueError(f"No ESP rates for payor age {age}")
    if duration not in ESP_DURATIONS:
        raise ValueError(f"Duration {duration} not available; choose from {ESP_DURATIONS}")
    rate = payor_rates.get(duration)
    if rate is None:
        raise ValueError(f"No ESP rate for age {age}, duration {duration}")
    annual  = round((coverage / 1000) * rate + POLICY_FEE_ANNUAL, 2)
    monthly = round(annual / 12, 2)
    return {
        "annual":      annual,
        "monthly":     monthly,
        "net_rate":    round(rate, 2),
        "policy_fee":  POLICY_FEE_ANNUAL,
        "esp_duration": duration,
    }


def _pa_quote(data: QuoteInput, age: int) -> dict:  # noqa: C901
    """Route to the correct PA rate table based on plan_code."""
    pc = data.plan_code
    cfg = PA_REGISTRY[pc]
    t = cfg["type"]
    sex = data.sex.upper()

    # ── 60A: AD&D per $1,000 FA ───────────────────────────────────────────────
    if t == "pa_add":
        band = "16-59" if age <= 59 else "60-69"
        rate = RATES_60A.get(data.occ_class, {}).get(band)
        if rate is None:
            raise HTTPException(422, f"No rate for class {data.occ_class}, age {age}.")
        if data.coverage_amount <= 0:
            raise HTTPException(422, "Coverage amount must be > 0.")
        annual  = round((data.coverage_amount / 1000) * rate, 2)
        return {"annual": annual, "monthly": round(annual / 12, 2),
                "net_rate": rate, "unit": "per $1,000 FA"}

    # ── 61A: Medical Expense base $2,000 + extra ──────────────────────────────
    elif t == "pa_med":
        entry = RATES_61A.get(data.occ_class)
        if entry is None:
            raise HTTPException(422, f"No rate for class {data.occ_class}.")
        base_rate, per_100 = entry
        benefit = max(data.coverage_amount, 2000.0)
        extra_hundreds = max(0, (benefit - 2000) / 100)
        annual  = round(base_rate + extra_hundreds * per_100, 2)
        return {"annual": annual, "monthly": round(annual / 12, 2),
                "note": f"Base $2,000 benefit; extra TTD {per_100:.2f} per $100 above base"}

    # ── 62A / 62B: Accident DI per $50 weekly benefit ─────────────────────────
    elif t == "pa_di_acc":
        code = "62A" if pc == "62A" else "62B"
        band = "16-59" if age <= 59 else "60-69"
        rate = RATES_62.get(data.occ_class, {}).get(code, {}).get(band)
        if rate is None:
            raise HTTPException(422, f"No rate for class {data.occ_class}, age {age}, plan {pc}.")
        weekly = max(data.coverage_amount, 50.0)
        annual = round((weekly / 50) * rate, 2)
        return {"annual": annual, "monthly": round(annual / 12, 2),
                "net_rate": rate, "unit": "per $50 weekly benefit",
                "weekly_benefit": weekly}

    # ── 67C / 67D: Hospital Income per $100 weekly benefit ────────────────────
    elif t == "pa_hospital":
        rates = RATES_67C if pc == "67C" else RATES_67D
        sex_rates = rates.get(sex, rates["M"])
        band = _age_band(age, sex_rates)
        if band is None:
            raise HTTPException(422, f"Age {age} is outside the available range for {pc}.")
        rate = sex_rates[band]
        weekly = max(data.coverage_amount, 100.0)
        annual = round((weekly / 100) * rate, 2)
        return {"annual": annual, "monthly": round(annual / 12, 2),
                "net_rate": rate, "unit": "per $100 weekly benefit",
                "weekly_benefit": weekly}

    # ── 68A: A&S DI per $50 weekly benefit, EP variant ───────────────────────
    elif t == "pa_as_di":
        ep = data.ep_code if data.ep_code in RATES_68A else "G_30S_14A"
        age_rates = RATES_68A[ep].get(data.occ_class)
        if age_rates is None:
            raise HTTPException(422, f"No rate for class {data.occ_class}.")
        band = _age_band(age, age_rates)
        if band is None:
            raise HTTPException(422, f"Age {age} outside range (18–57) for A&S DI.")
        rate = age_rates[band]
        if rate is None:
            raise HTTPException(422, f"Not available for class {data.occ_class}, age {age}.")
        weekly = max(data.coverage_amount, 50.0)
        annual = round((weekly / 50) * rate, 2)
        return {"annual": annual, "monthly": round(annual / 12, 2),
                "net_rate": rate, "unit": "per $50 weekly benefit",
                "weekly_benefit": weekly,
                "ep_label": EP_LABELS.get(ep, ep)}

    # ── 77B: Surgical Expense per $1,000 benefit ─────────────────────────────
    elif t == "pa_surgical":
        sex_rates = RATES_77B.get(sex, RATES_77B["M"])
        band = _age_band(age, sex_rates)
        if band is None:
            raise HTTPException(422, f"Age {age} is outside available range for 77B.")
        rate = sex_rates[band]
        benefit = max(data.coverage_amount, 1000.0)
        annual  = round((benefit / 1000) * rate, 2)
        return {"annual": annual, "monthly": round(annual / 12, 2),
                "net_rate": rate, "unit": "per $1,000 benefit"}

    # ── 78C: Accident Annuity per $1,000 monthly benefit ─────────────────────
    elif t == "pa_annuity":
        rate = RATES_78C.get(data.occ_class)
        if rate is None:
            raise HTTPException(422, f"No rate for class {data.occ_class} (max class 3 for 78C).")
        monthly_benefit = max(data.coverage_amount, 1000.0)
        annual = round((monthly_benefit / 1000) * rate, 2)
        return {"annual": annual, "monthly": round(annual / 12, 2),
                "net_rate": rate, "unit": "per $1,000 monthly benefit"}

    # ── 69L: Level Term Life per $1,000 FA ───────────────────────────────────
    elif t == "pa_term":
        band = _age_band(age, RATES_69L)
        if band is None:
            raise HTTPException(422, f"Age {age} is outside range (5–55) for 69L.")
        rate = RATES_69L[band]
        fa = max(data.coverage_amount, 1000.0)
        annual = round((fa / 1000) * rate, 2)
        return {"annual": annual, "monthly": round(annual / 12, 2),
                "net_rate": rate, "unit": "per $1,000 face amount"}

    # ── CI: Critical Illness per $1,000 benefit ───────────────────────────────
    elif t == "pa_ci":
        entry = RATES_CI.get(age)
        if entry is None:
            raise HTTPException(422, f"Age {age} outside available range (5–61) for CI.")
        rate = entry[0] if sex == "M" else entry[1]
        benefit = max(data.coverage_amount, 1000.0)
        annual  = round((benefit / 1000) * rate, 2)
        return {"annual": annual, "monthly": round(annual / 12, 2),
                "net_rate": rate, "unit": "per $1,000 benefit amount"}

    # ── PP: Personal Protector per unit ───────────────────────────────────────
    elif t == "pa_pp":
        rates = RATES_PP_MALE if sex == "M" else RATES_PP_FEMALE
        class_rates = rates.get(data.occ_class)
        if class_rates is None:
            raise HTTPException(422, f"Class {data.occ_class} not available (max class 3) for Personal Protector.")
        band = _age_band(age, class_rates)
        if band is None:
            raise HTTPException(422, f"Age {age} is outside range (0–55) for Personal Protector.")
        rate_per_unit = class_rates[band]
        units = max(1, int(data.coverage_amount)) if data.coverage_amount > 0 else 1
        annual  = round(rate_per_unit * units, 2)
        monthly = round(annual / 11, 2)  # rater note: "Para Mensual dividir por 11"
        return {"annual": annual, "monthly": monthly,
                "rate_per_unit": rate_per_unit, "units": units,
                "note": "Monthly = annual / 11 (as per PA rater)"}

    # ── TP: Total Protector per unit ──────────────────────────────────────────
    elif t == "pa_tp":
        band = _age_band(age, RATES_TOTAL_PROTECTOR)
        if band is None:
            raise HTTPException(422, f"Age {age} outside range (0–59) for Total Protector.")
        rate_per_unit = RATES_TOTAL_PROTECTOR[band]
        units = max(1, int(data.coverage_amount)) if data.coverage_amount > 0 else 1
        annual  = round(rate_per_unit * units, 2)
        return {"annual": annual, "monthly": round(annual / 12, 2),
                "rate_per_unit": rate_per_unit, "units": units}

    # ── SFP: Super Family Protector per unit ──────────────────────────────────
    elif t == "pa_sfp":
        band = _age_band(age, RATES_SUPER_FAMILY)
        if band is None:
            raise HTTPException(422, f"Age {age} outside range (0–59) for Super Family Protector.")
        rate_per_unit = RATES_SUPER_FAMILY[band]
        units = max(1, int(data.coverage_amount)) if data.coverage_amount > 0 else 1
        annual  = round(rate_per_unit * units, 2)
        return {"annual": annual, "monthly": round(annual / 12, 2),
                "rate_per_unit": rate_per_unit, "units": units}

    # ── SFP-SP / SFP-FG: Supreme Family Protector ─────────────────────────────
    elif t == "pa_supreme":
        rates = RATES_SUPREME_SINGLE if pc == "SFP-SP" else RATES_SUPREME_FAMILY
        band  = _age_band(age, rates)
        if band is None:
            raise HTTPException(422, f"Age {age} outside range for Supreme Family Protector.")
        plan  = data.plan_tier if data.plan_tier in ("I", "II", "III", "IV") else "I"
        annual = rates[band][plan]
        return {"annual": annual, "monthly": round(annual / 12, 2), "plan": plan}

    # ── CCP-C: Cancer Care Plus Plan C — fixed price ──────────────────────────
    elif t == "pa_ccp":
        return {"annual": RATE_CANCER_CARE_PLUS_C,
                "monthly": round(RATE_CANCER_CARE_PLUS_C / 12, 2),
                "note": "Fixed annual premium — Cancer Care Plus Plan C: Standard Care"}

    # ── CC-A/B/C: Cancer Care Cover by plan tier ─────────────────────────────
    elif t == "pa_cc":
        cc_plan = {"CC-A": "A", "CC-B": "B", "CC-C": "C"}[pc]
        plan_rates = RATES_CANCER_CARE[cc_plan]
        band = _age_band(age, plan_rates)
        if band is None:
            raise HTTPException(422, f"Age {age} outside range (1–55) for Cancer Care Cover.")
        ct = data.coverage_type if data.coverage_type in (
            "Individual", "Single_Parent", "Husband_Wife", "Full_Family"
        ) else "Individual"
        monthly = plan_rates[band][ct]
        annual  = round(monthly * 12, 2)
        child_rider_monthly = CANCER_CARE_CHILD_RIDER[cc_plan]
        return {"monthly": monthly, "annual": annual,
                "coverage_type": ct,
                "child_rider_monthly": child_rider_monthly,
                "note": "Monthly premium — Cancer Care Cover"}

    # ── LS-STD / LS-ENH: Life Support monthly rates ───────────────────────────
    elif t == "pa_ls":
        rates = RATES_LS_STANDARD if pc == "LS-STD" else RATES_LS_ENHANCED
        sex_rates = rates.get(sex, rates["M"])
        band = _age_band(age, sex_rates)
        if band is None:
            raise HTTPException(422, f"Age {age} outside range (1–64) for Life Support.")
        tier = data.plan_tier if data.plan_tier in ("Platinum", "Gold", "Silver") else "Platinum"
        monthly = sex_rates[band][tier]
        annual  = round(monthly * 12, 2)
        return {"monthly": monthly, "annual": annual, "plan_tier": tier}

    # ── IS: Income Shield — calculate from component rates ────────────────────
    elif t == "pa_is":
        # One unit = $200,000 60A + $10,000 69L + $500/wk 68A(G) + $5,000 61A + $500/wk 67C
        errors = []
        total = 0.0

        # 60A: $200,000
        band_60a = "16-59" if age <= 59 else "60-69"
        r60a = RATES_60A.get(data.occ_class, {}).get(band_60a)
        if r60a:
            total += (200000 / 1000) * r60a

        # 69L: $10,000
        band_69l = _age_band(age, RATES_69L)
        if band_69l:
            total += (10000 / 1000) * RATES_69L[band_69l]

        # 68A G_30S_14A: $500/wk
        ep_r = RATES_68A["G_30S_14A"].get(data.occ_class)
        if ep_r:
            age_b = _age_band(age, ep_r)
            r68a = ep_r.get(age_b) if age_b else None
            if r68a:
                total += (500 / 50) * r68a

        # 61A: $5,000 ($2,000 base + $3,000 extra → 30 units of $100)
        r61a = RATES_61A.get(data.occ_class)
        if r61a:
            total += r61a[0] + 30 * r61a[1]

        # 67C: $500/wk
        sex_67c = RATES_67C.get(sex, RATES_67C["M"])
        band_67c = _age_band(age, sex_67c)
        if band_67c:
            total += (500 / 100) * sex_67c[band_67c]

        units = max(1, int(data.coverage_amount)) if data.coverage_amount > 0 else 1
        annual  = round(total * units, 2)
        return {"annual": annual, "monthly": round(annual / 12, 2),
                "units": units,
                "note": "Income Shield includes 60A, 69L, 68A, 61A, 67C benefits per unit"}

    raise HTTPException(422, f"Unknown PA plan type: {t}")


@router.get("/pa-tiers")
def get_pa_tiers():
    """Return PA&S package tier pricing — no auth required."""
    return PA_TIERS


@router.get("/plans")
def list_plans():
    """Return all available plan codes and their display names."""
    return [
        {"plan_code": code, "name": cfg["name"], "plan_type": cfg["type"]}
        for code, cfg in PLAN_REGISTRY.items()
    ]


@router.post("/calculate")
async def calculate_quote(
    data: QuoteInput,
    current: dict = Depends(get_current_client),
):
    """
    Calculate an indicative premium quote.
    Age source priority: date_of_birth in request > client fact-find.
    If plan_code is provided it routes to that specific plan's rate table.
    """
    # ── Fixed-price PA plans — no age required ────────────────────────────────
    if data.plan_code == "CCP-C":
        return {
            "product_line": "PA&S",
            "plan_code":    "CCP-C",
            "plan_name":    "Cancer Care Plus - Plan C: Standard Care",
            "annual":       RATE_CANCER_CARE_PLUS_C,
            "monthly":      round(RATE_CANCER_CARE_PLUS_C / 12, 2),
            "note":         "Fixed annual premium — Cancer Care Plus Plan C: Standard Care",
        }

    # ── Resolve age ──────────────────────────────────────────────────────────
    age: Optional[int] = None

    if data.date_of_birth:
        try:
            age = _age_from_dob(data.date_of_birth)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid date of birth. Use YYYY-MM-DD.")
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

    # ── Route by plan_code — PA&S plans ──────────────────────────────────────
    if data.plan_code and data.plan_code in PA_REGISTRY:
        cfg = PA_REGISTRY[data.plan_code]
        result = _pa_quote(data, age)
        return {
            "product_line": "PA&S",
            "plan_code": data.plan_code,
            "plan_name": cfg["name"],
            "age": age,
            **result,
        }

    # ── Route by plan_code (Life plans) ──────────────────────────────────────
    if data.plan_code and data.plan_code in PLAN_REGISTRY:
        cfg = PLAN_REGISTRY[data.plan_code]
        plan_type = cfg["type"]

        if plan_type == "esp":
            # Education Security Plan
            if data.coverage_amount <= 0:
                raise HTTPException(status_code=422, detail="Coverage amount must be greater than 0.")
            if data.esp_duration not in ESP_DURATIONS:
                raise HTTPException(
                    status_code=422,
                    detail=f"Please select a duration ({ESP_DURATIONS[0]}–{ESP_DURATIONS[-1]} years).",
                )
            if age < cfg["min_age"] or age > cfg["max_age"]:
                raise HTTPException(
                    status_code=422,
                    detail=f"Age {age} is outside the available range ({cfg['min_age']}–{cfg['max_age']}) for this plan.",
                )
            try:
                prem = _esp_premium(age, data.esp_duration, data.coverage_amount)
            except ValueError as e:
                raise HTTPException(status_code=422, detail=str(e))
            return {
                "product_line":    "Life",
                "plan_code":       data.plan_code,
                "plan_name":       cfg["name"],
                "age":             age,
                "coverage_amount": data.coverage_amount,
                **prem,
            }

        else:
            # Standard life or unisex (Silver Lining)
            if data.coverage_amount <= 0:
                raise HTTPException(status_code=422, detail="Coverage amount must be greater than 0.")
            if age < cfg["min_age"] or age > cfg["max_age"]:
                raise HTTPException(
                    status_code=422,
                    detail=f"Age {age} is outside the available range ({cfg['min_age']}–{cfg['max_age']}) for this plan.",
                )
            try:
                prem = _life_premium(data.plan_code, age, data.sex, data.smoker,
                                     data.coverage_amount)
            except ValueError as e:
                raise HTTPException(status_code=422, detail=str(e))
            cash_values = get_cash_values(data.plan_code, age, data.coverage_amount)
            return {
                "product_line":    "Life",
                "plan_code":       data.plan_code,
                "plan_name":       cfg["name"],
                "age":             age,
                "sex":             data.sex,
                "smoker":          data.smoker,
                "coverage_amount": data.coverage_amount,
                "cash_values":     cash_values,
                **prem,
            }

    # ── Fallback: route by product_line ──────────────────────────────────────
    if data.product_line == "Life":
        # Legacy fallback — use Plan 001-NP (Ordinary Life Non-Participating)
        if data.coverage_amount <= 0:
            raise HTTPException(status_code=422, detail="Coverage amount must be greater than 0.")
        if age < 10 or age > 65:
            raise HTTPException(status_code=422, detail="Age must be between 10 and 65 for an Ordinary Life quote. Please select a specific plan for your age.")
        prem = _life_premium("001-NP", age, data.sex, data.smoker, data.coverage_amount)
        return {
            "product_line":    "Life",
            "plan_code":       "001-NP",
            "plan_name":       "Ordinary Life - Non-Participating",
            "age":             age,
            "sex":             data.sex,
            "smoker":          data.smoker,
            "coverage_amount": data.coverage_amount,
            **prem,
        }

    elif data.product_line == "PA&S":
        raise HTTPException(
            status_code=422,
            detail="Please select a specific PA&S product to get a quote.",
        )

    elif data.product_line == "Health":
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

    elif data.product_line == "Annuities":
        return {
            "product_line": "Annuities",
            "age":          age,
            "annual":       0,
            "monthly":      0,
            "note":         "Annuity illustrations are personalised. An advisor will contact you.",
        }

    else:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown product line or plan code: {data.product_line} / {data.plan_code}",
        )
