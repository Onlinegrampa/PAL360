from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional

from engine import UserProfile
from engine.hcv import calculate_hcv
from engine.cre import calculate_cre
from engine.dimes import calculate_dimes
from engine.annuity import calculate_cat
from engine.ci_multiplier import calculate_ci
from engine.scoring import generate_action_plan, get_traffic_light

router = APIRouter()


class FortressResponse(BaseModel):
    hcv: dict
    cre: dict
    dimes: dict
    cat: dict
    ci: dict
    action_plan: list
    traffic_lights: dict


@router.post("/financial-fortress/calculate", response_model=FortressResponse)
def calculate_fortress(profile: UserProfile):
    """
    Run all Financial Fortress engines against the submitted UserProfile.
    Returns HCV, CRE, DIME-S+, CAT, CI, action plan, and traffic light states.
    No auth required — tool is public for prospect use.
    """
    hcv   = calculate_hcv(profile)
    cre   = calculate_cre(profile)
    dimes = calculate_dimes(profile)
    cat   = calculate_cat(profile)
    ci    = calculate_ci(profile)
    plan  = generate_action_plan(cre, dimes, cat, ci, hcv)

    traffic_lights = {
        "premature_death": get_traffic_light(cre["premature_death_score"]),
        "morbidity":       get_traffic_light(cre["morbidity_score"]),
        "longevity":       get_traffic_light(cre["longevity_score"]),
        "currency":        get_traffic_light(cre["currency_score"]),
    }

    return FortressResponse(
        hcv=hcv,
        cre=cre,
        dimes=dimes,
        cat=cat,
        ci=ci,
        action_plan=plan,
        traffic_lights=traffic_lights,
    )
