def calculate_dimes(profile) -> dict:
    """
    DIME-S+ = D + I + M + E + S + Sv
    D  = Debt coverage need
    I  = Income replacement (10x rule)
    M  = Mortgage payoff balance
    E  = Education fund needed
    S  = Succession/estate gap
    Sv = Sovereignty/currency hedge (offshore reserve target)
    """

    D = profile.total_debt_usd
    I = profile.annual_income_usd * 10  # 10x income replacement
    M = profile.mortgage_balance_usd
    E = profile.education_fund_needed_usd
    S = max(0, profile.estate_value_usd * 0.20)  # 20% estate reserve

    # Sovereignty hedge: 6 months income in USD-equivalent hard currency
    Sv = profile.annual_income_usd * 0.5

    total_need = D + I + M + E + S + Sv

    return {
        "total_dimes_need_usd": round(total_need, 2),
        "debt_component": round(D, 2),
        "income_replacement": round(I, 2),
        "mortgage_component": round(M, 2),
        "education_component": round(E, 2),
        "succession_component": round(S, 2),
        "sovereignty_hedge": round(Sv, 2),
    }
