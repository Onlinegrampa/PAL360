import numpy as np


def calculate_hcv(profile) -> dict:
    """
    HCV = sum over t=1 to n of [ E_t * (1+g)^t / (1+i)^t ] - PV(self-maintenance costs)
    Where:
      n  = years to retirement
      E_t = current annual income (base, grows at g each year)
      g  = income growth rate
      i  = personal discount rate
    """
    n = max(profile.retirement_age - profile.age, 1)
    E = profile.annual_income_usd
    g = profile.income_growth_rate
    i = profile.discount_rate

    t_values = np.arange(1, n + 1)
    income_pv = np.sum(E * (1 + g)**t_values / (1 + i)**t_values)

    # PV of self-maintenance costs over same period
    maintenance_pv = np.sum(
        profile.annual_living_costs_usd * (1 + profile.inflation_rate_home)**t_values
        / (1 + i)**t_values
    )

    net_hcv = income_pv - maintenance_pv

    return {
        "gross_hcv_usd": round(income_pv, 2),
        "maintenance_pv_usd": round(maintenance_pv, 2),
        "net_hcv_usd": round(net_hcv, 2),
        "years_to_retirement": n,
    }
