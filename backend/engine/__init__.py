from pydantic import BaseModel, Field
from typing import Optional


class UserProfile(BaseModel):
    # Identity
    name: str
    age: int = Field(ge=18, le=80)
    retirement_age: int = Field(default=65)

    # Income
    annual_income_usd: float          # Always collect in USD equivalent
    income_growth_rate: float = 0.03  # g — annual growth assumption
    discount_rate: float = 0.08       # i — personal discount rate

    # Debts
    total_debt_usd: float
    mortgage_balance_usd: float
    mortgage_years_remaining: int

    # Dependants
    num_dependants: int
    education_fund_needed_usd: float

    # Currency
    home_currency: str = "TTD"        # e.g. TTD, GYD, JMD
    usd_fx_rate: float                # 1 USD = X home currency
    inflation_rate_home: float = 0.06 # Local inflation rate

    # Health
    smoker: bool = False
    pre_existing_conditions: bool = False

    # Succession
    estate_value_usd: float = 0.0
    has_will: bool = False

    # Annuity
    desired_retirement_income_usd: float  # Annual income needed in retirement
    existing_pension_usd: float = 0.0

    # Self-maintenance (for HCV deduction)
    annual_living_costs_usd: float        # Food, housing, personal expenses
