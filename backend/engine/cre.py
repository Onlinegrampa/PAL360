def calculate_cre(profile) -> dict:
    """
    CRE aggregates 4 risk dimensions, each scored 0-100.
    Returns weighted composite score and per-domain scores.
    """

    # 1. Premature Death Risk (0-100)
    death_base = max(0, (profile.age - 25) * 1.5)
    death_smoker = 20 if profile.smoker else 0
    death_dependants = min(profile.num_dependants * 8, 30)
    death_score = min(death_base + death_smoker + death_dependants, 100)

    # 2. Morbidity Risk (0-100)
    morbidity_base = max(0, (profile.age - 30) * 1.2)
    morbidity_conditions = 25 if profile.pre_existing_conditions else 0
    morbidity_smoker = 15 if profile.smoker else 0
    morbidity_score = min(morbidity_base + morbidity_conditions + morbidity_smoker, 100)

    # 3. Longevity Risk (0-100) — risk of outliving money
    years_in_retirement = max(85 - profile.retirement_age, 0)
    pension_coverage = profile.existing_pension_usd / max(profile.desired_retirement_income_usd, 1)
    longevity_score = min(max(0, (years_in_retirement * 2) - (pension_coverage * 30)), 100)

    # 4. Currency / Inflation Erosion Risk (0-100)
    inflation_score = min(profile.inflation_rate_home * 500, 60)
    fx_volatility_score = 30 if profile.home_currency not in ["USD", "EUR", "GBP"] else 10
    currency_score = min(inflation_score + fx_volatility_score, 100)

    # Weighted composite (weights sum to 1.0)
    weights = {
        "premature_death": 0.30,
        "morbidity": 0.25,
        "longevity": 0.25,
        "currency_inflation": 0.20,
    }

    composite = (
        death_score * weights["premature_death"]
        + morbidity_score * weights["morbidity"]
        + longevity_score * weights["longevity"]
        + currency_score * weights["currency_inflation"]
    )

    return {
        "cre_composite": round(composite, 1),
        "premature_death_score": round(death_score, 1),
        "morbidity_score": round(morbidity_score, 1),
        "longevity_score": round(longevity_score, 1),
        "currency_score": round(currency_score, 1),
    }
