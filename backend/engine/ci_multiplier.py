def calculate_ci(profile) -> dict:
    """
    CI cover needed = (3 x Annual Salary) + USD-pegged treatment costs
    Treatment cost benchmark by condition type (USD, 2024 estimates):
      - Cancer treatment:      $120,000
      - Cardiac event:         $80,000
      - Stroke rehabilitation: $60,000
    Use the highest applicable cost as the peg.
    """
    salary_component = profile.annual_income_usd * 3

    # Risk-adjusted treatment cost
    if profile.pre_existing_conditions:
        treatment_peg = 120_000  # Worst-case cancer benchmark
    elif profile.smoker:
        treatment_peg = 80_000   # Cardiac/respiratory
    else:
        treatment_peg = 60_000   # General stroke/acute event

    total_ci_cover = salary_component + treatment_peg

    return {
        "salary_component_usd": round(salary_component, 2),
        "treatment_peg_usd": treatment_peg,
        "total_ci_cover_needed_usd": round(total_ci_cover, 2),
    }
