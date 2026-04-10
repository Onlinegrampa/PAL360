def generate_action_plan(cre: dict, dimes: dict, cat: dict, ci: dict, hcv: dict) -> list:
    """
    Returns a list of action items sorted by urgency (highest risk score first).
    Each item: { priority, domain, score, action, rationale }
    """
    items = []

    if cre["premature_death_score"] >= 60:
        items.append({
            "priority": cre["premature_death_score"],
            "domain": "Life Cover",
            "score": cre["premature_death_score"],
            "action": f"Secure life insurance of at least USD {dimes['total_dimes_need_usd']:,.0f} (full DIME-S+ need).",
            "rationale": "Premature death risk is HIGH. Your dependants have critical income exposure.",
        })

    if cre["morbidity_score"] >= 50:
        items.append({
            "priority": cre["morbidity_score"],
            "domain": "Critical Illness",
            "score": cre["morbidity_score"],
            "action": f"Obtain CI cover of USD {ci['total_ci_cover_needed_usd']:,.0f} (3x salary + treatment peg).",
            "rationale": "Morbidity risk is ELEVATED. A serious illness could devastate your finances.",
        })

    if cre["longevity_score"] >= 55:
        items.append({
            "priority": cre["longevity_score"],
            "domain": "Retirement / Annuity",
            "score": cre["longevity_score"],
            "action": f"Begin funding your CAT. Lump sum needed today: USD {cat['lump_sum_needed_today_usd']:,.0f}.",
            "rationale": "Longevity risk is HIGH. You risk outliving your savings by a significant margin.",
        })

    if cre["currency_score"] >= 50:
        items.append({
            "priority": cre["currency_score"],
            "domain": "Currency Hedge",
            "score": cre["currency_score"],
            "action": f"Build a USD/hard-currency reserve of at least USD {dimes['sovereignty_hedge']:,.0f} (6-month income equivalent).",
            "rationale": "Currency erosion risk is HIGH. Local inflation and FX volatility threaten purchasing power.",
        })

    if hcv["net_hcv_usd"] <= 0:
        items.append({
            "priority": 95,
            "domain": "Human Capital",
            "score": 95,
            "action": "Your maintenance costs exceed your projected income PV. Review income growth and cost reduction immediately.",
            "rationale": "Net HCV is negative — a critical structural imbalance.",
        })

    # Sort by priority descending
    items.sort(key=lambda x: x["priority"], reverse=True)

    # Add sequence numbers
    for i, item in enumerate(items):
        item["step"] = i + 1

    return items


def get_traffic_light(score: float) -> str:
    if score >= 65:
        return "RED"
    elif score >= 40:
        return "YELLOW"
    else:
        return "GREEN"
