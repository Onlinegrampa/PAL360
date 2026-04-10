import numpy as np


def calculate_cat(profile) -> dict:
    """
    CAT = PV of the inflation-adjusted annuity income gap over retirement horizon.
    Gap = desired_retirement_income - existing_pension
    Discounted at a conservative safe floor rate (4%).
    """

    gap = max(profile.desired_retirement_income_usd - profile.existing_pension_usd, 0)
    years_in_retirement = max(85 - profile.retirement_age, 1)
    safe_floor_rate = 0.04
    inflation = profile.inflation_rate_home

    t_values = np.arange(1, years_in_retirement + 1)
    # Each year's gap grows with inflation, discounted at safe floor rate
    cat = np.sum(gap * (1 + inflation)**t_values / (1 + safe_floor_rate)**t_values)

    # Lump-sum needed today to fund this annuity
    years_to_retirement = max(profile.retirement_age - profile.age, 1)
    lump_sum_today = cat / (1 + safe_floor_rate)**years_to_retirement

    return {
        "annual_income_gap_usd": round(gap, 2),
        "cat_at_retirement_usd": round(cat, 2),
        "lump_sum_needed_today_usd": round(lump_sum_today, 2),
        "years_in_retirement": years_in_retirement,
    }
