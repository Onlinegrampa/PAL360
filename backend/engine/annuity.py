def calculate_cat(profile) -> dict:
    """
    CAT = PV of the inflation-adjusted annuity income gap over retirement horizon.
    Gap = desired_retirement_income - existing_pension
    Discounted at a conservative safe floor rate (4%).
    Pure Python — no numpy required.
    """
    gap = max(profile.desired_retirement_income_usd - profile.existing_pension_usd, 0)
    years_in_retirement = max(85 - profile.retirement_age, 1)
    safe_floor_rate = 0.04
    inflation = profile.inflation_rate_home

    cat = sum(
        gap * (1 + inflation)**t / (1 + safe_floor_rate)**t
        for t in range(1, years_in_retirement + 1)
    )

    years_to_retirement = max(profile.retirement_age - profile.age, 1)
    lump_sum_today = cat / (1 + safe_floor_rate)**years_to_retirement

    return {
        "annual_income_gap_usd": round(gap, 2),
        "cat_at_retirement_usd": round(cat, 2),
        "lump_sum_needed_today_usd": round(lump_sum_today, 2),
        "years_in_retirement": years_in_retirement,
    }
