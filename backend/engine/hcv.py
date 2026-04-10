def calculate_hcv(profile) -> dict:
    """
    HCV = sum over t=1 to n of [ E * (1+g)^t / (1+i)^t ] - PV(self-maintenance costs)
    Pure Python — no numpy required.
    """
    n = max(profile.retirement_age - profile.age, 1)
    E = profile.annual_income_usd
    g = profile.income_growth_rate
    i = profile.discount_rate

    income_pv = sum(E * (1 + g)**t / (1 + i)**t for t in range(1, n + 1))

    maintenance_pv = sum(
        profile.annual_living_costs_usd * (1 + profile.inflation_rate_home)**t / (1 + i)**t
        for t in range(1, n + 1)
    )

    net_hcv = income_pv - maintenance_pv

    return {
        "gross_hcv_usd": round(income_pv, 2),
        "maintenance_pv_usd": round(maintenance_pv, 2),
        "net_hcv_usd": round(net_hcv, 2),
        "years_to_retirement": n,
    }
