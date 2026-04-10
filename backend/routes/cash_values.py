"""
Guaranteed Cash Value lookup from pre-extracted GCV tables.

Data source: Individual Life Illustration Software.xls → Tablas sheet (Q-series).
Calibrated: 'Ordinary LifeQ53' matches CotizacionTrad exactly for OL-NP, age 57, Female.
Key mapping: Q_code = issue_age - 4  →  issue_age = Q_code + 4.

Returns GCV per $1,000 face amount for policy years 1-30.
"""
import json
import os
from typing import Optional

_GCV_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "seeds", "gcv_tables.json")

# Lazy-load the table once
_GCV_TABLES: Optional[dict] = None


def _load_tables() -> dict:
    global _GCV_TABLES
    if _GCV_TABLES is None:
        with open(_GCV_PATH, encoding="utf-8") as f:
            _GCV_TABLES = json.load(f)
    return _GCV_TABLES


# Map from our plan_code to the GCV table key in gcv_tables.json
# Only permanent (whole-life / endowment) plans have cash values.
# Term plans, Silver Lining, Level Term Riders → no cash values.
GCV_PLAN_MAP: dict[str, str] = {
    # Ordinary Life
    "001-P":  "001",
    "001-NP": "001",
    # Limited-Pay Life (using 30-Payment Life GCV as closest proxy)
    "002-P":  "002",
    "002-NP": "002",
    "005-P":  "002",   # 15-Pay — approximate with 30-Pay (nearest available)
    "005-NP": "002",
    "010-P":  "010",
    "010-NP": "010",
    "028-P":  "028",   # Life Paid Up at 65
    # Endowment Plans
    "015-P":  "015",
    "015-NP": "015",
    "020-P":  "020",
    "020-NP": "020",
    "025-P":  "020",   # 25-Year Endowment — approximate with 20-Year
    "025-NP": "020",
    "026-P":  "020",   # 30-Year Endowment — approximate with 20-Year
    "026-NP": "020",
    "027-P":  "027",   # Endowment to Age 65
    "027-NP": "027",
    "032-P":  "032",   # Endowment at 55
}

# Plans where cash values grow to a fixed maturity (for tooltip)
ENDOWMENT_PLANS = {
    "015-P", "015-NP",   # 15-Year Endowment
    "020-P", "020-NP",   # 20-Year Endowment
    "025-P", "025-NP",   # 25-Year Endowment
    "026-P", "026-NP",   # 30-Year Endowment
    "027-P", "027-NP",   # Endowment to Age 65
    "028-P",             # Life Paid Up at 65
    "032-P",             # Endowment at 55
}


def get_cash_values(
    plan_code: str,
    issue_age: int,
    coverage_amount: float,
    years: int = 25,
) -> Optional[list[dict]]:
    """
    Return a list of cash value rows for display.

    Each row: {"year": N, "age": issue_age + N, "gcv": $amount, "death_benefit": $coverage}
    Returns None if the plan has no cash values or age is out of range.
    """
    table_key = GCV_PLAN_MAP.get(plan_code)
    if table_key is None:
        return None

    tables = _load_tables()
    plan_table = tables.get(table_key, {})
    if not plan_table:
        return None

    # Look up the GCV per $1,000 for this issue age
    gcv_per_1k = plan_table.get(str(issue_age))
    if gcv_per_1k is None:
        # Try adjacent ages (±1) as fallback
        for adj in (issue_age - 1, issue_age + 1, issue_age - 2, issue_age + 2):
            gcv_per_1k = plan_table.get(str(adj))
            if gcv_per_1k:
                break

    if gcv_per_1k is None:
        return None

    units = coverage_amount / 1000.0
    rows = []
    n = min(years, len(gcv_per_1k), 30)
    for year in range(1, n + 1):
        idx = year - 1
        gcv_dollar = round(gcv_per_1k[idx] * units, 2)
        rows.append({
            "year": year,
            "age": issue_age + year,
            "gcv": gcv_dollar,
            "death_benefit": round(coverage_amount, 2),
        })

    return rows if any(r["gcv"] > 0 for r in rows) else None
