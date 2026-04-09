from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from db import get_pool
from auth import get_current_client

router = APIRouter(prefix="/fact-finds", tags=["fact-finds"])


class FactFindInput(BaseModel):
    annual_income: float
    annual_expenses: float
    total_debt: float
    num_dependents: int
    financial_goals: str


def _calculate_insurance_needed(income: float, expenses: float, debt: float) -> float:
    """DIME method: Debt + Income×10 + Expenses×10 + Final expenses."""
    return debt + (income * 10) + (expenses * 10) + 15_000


def _status_label(gap_pct: float) -> str:
    if gap_pct < 30:
        return "low_gap"
    if gap_pct < 70:
        return "medium_gap"
    return "high_gap"


def _fmt(row: dict) -> dict:
    return {
        "id":                    row["id"],
        "client_id":             row["client_id"],
        "annual_income":         float(row["annual_income"]),
        "annual_expenses":       float(row["annual_expenses"]),
        "total_debt":            float(row["total_debt"]),
        "num_dependents":        row["num_dependents"],
        "financial_goals":       row["financial_goals"],
        "life_insurance_needed": float(row["life_insurance_needed"]),
        "current_coverage":      float(row["current_coverage"]),
        "protection_gap":        float(row["protection_gap"]),
        "gap_percentage":        float(row["gap_percentage"]),
        "status":                _status_label(float(row["gap_percentage"])),
        "created_at":            row["created_at"].isoformat(),
    }


@router.post("/calculate")
async def calculate_fact_find(
    data: FactFindInput,
    current: dict = Depends(get_current_client),
):
    """Submit a fact-find and calculate the protection gap."""
    client_id = current["sub"]
    pool = get_pool()
    async with pool.acquire() as conn:
        # Sum all active policies for this client
        raw_coverage = await conn.fetchval(
            """
            SELECT COALESCE(SUM(coverage_amount), 0)
            FROM   policies
            WHERE  client_id = $1 AND status = 'IN-FORCE'
            """,
            client_id,
        )
        current_coverage = float(raw_coverage or 0)

        insurance_needed = _calculate_insurance_needed(
            data.annual_income, data.annual_expenses, data.total_debt
        )
        protection_gap = max(0.0, insurance_needed - current_coverage)
        gap_pct = (protection_gap / insurance_needed * 100) if insurance_needed > 0 else 0.0

        # Retire previous assessments
        await conn.execute(
            "UPDATE fact_finds SET is_current = false WHERE client_id = $1",
            client_id,
        )

        row = await conn.fetchrow(
            """
            INSERT INTO fact_finds
              (client_id, annual_income, annual_expenses, total_debt,
               num_dependents, financial_goals,
               life_insurance_needed, current_coverage, protection_gap,
               gap_percentage, is_current)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)
            RETURNING *
            """,
            client_id,
            data.annual_income,
            data.annual_expenses,
            data.total_debt,
            data.num_dependents,
            data.financial_goals,
            insurance_needed,
            current_coverage,
            protection_gap,
            gap_pct,
        )

    return _fmt(dict(row))


@router.get("/current")
async def get_current_fact_find(current: dict = Depends(get_current_client)):
    """Return the client's most recent assessment."""
    client_id = current["sub"]
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM fact_finds WHERE client_id = $1 AND is_current = true",
            client_id,
        )
    if not row:
        raise HTTPException(status_code=404, detail="No assessment found for this client")
    return _fmt(dict(row))
