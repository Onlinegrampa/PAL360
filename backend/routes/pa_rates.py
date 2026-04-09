# ============================================================
# PA RATES — extracted from Personal Accident Rater v7.0
# All monetary values are TTD
# ============================================================

# ── AD&D 60A: per $1,000 FA, by class and age band ──────────────────────────
# None = Not Available / Not Written
RATES_60A = {
    1: {"16-59": 1.65,  "60-69": 3.00},
    2: {"16-59": 2.50,  "60-69": 3.75},
    3: {"16-59": 4.50,  "60-69": 7.50},
    4: {"16-59": 5.63,  "60-69": None},
}

# ── Medical Expense 61A: per $2,000 base benefit ──────────────────────────────
# Tuple: (annual_rate_per_2000_base, annual_rate_per_100_extra)
RATES_61A = {
    1: (31.00, 1.25),
    2: (47.00, 1.90),
    3: (78.12, 3.15),
    4: (97.96, 3.95),
}

# ── Accident DI 62A (52wk) & 62B (104wk): per $50 weekly benefit ─────────────
# {class: {"62A": {age_band: rate}, "62B": {age_band: rate}}}
RATES_62 = {
    1: {"62A": {"16-59": 20.00, "60-69": 30.00},
        "62B": {"16-59": 26.00, "60-69": 39.00}},
    2: {"62A": {"16-59": 32.50, "60-69": 46.00},
        "62B": {"16-59": 42.25, "60-69": 58.50}},
    3: {"62A": {"16-59": 47.50, "60-69": 60.00},
        "62B": {"16-59": 61.75, "60-69": 78.00}},
    4: {"62A": {"16-59": 58.95, "60-69": None},
        "62B": {"16-59": None,  "60-69": None}},
}

# ── A&S Disability Income 68A: per $50 weekly benefit, EP variants ────────────
# ep_code keys correspond to elimination period combinations:
#   A_30_30   = 30 days S & 30 days A
#   B_60_60   = 60 days S & 60 days A
#   C_90_90   = 90 days S & 90 days A
#   D_30S_0A  = 30 days S, 0 days A
#   E_60S_0A  = 60 days S, 0 days A
#   F_90S_0A  = 90 days S, 0 days A
#   G_30S_14A = 30 days S, 14 days A  ← default used in InsuredOnly schedule
#   H_60S_14A = 60 days S, 14 days A
#   I_90S_14A = 90 days S, 14 days A
RATES_68A = {
    "A_30_30": {
        1: {"18-39": 38.0,  "40-49": 66.0,  "50-57": 92.0},
        2: {"18-39": 42.0,  "40-49": 70.0,  "50-57": 102.0},
        3: {"18-39": 48.0,  "40-49": 80.0,  "50-57": 116.0},
        4: {"18-39": None,  "40-49": None,  "50-57": None},
    },
    "B_60_60": {
        1: {"18-39": 28.0,  "40-49": 46.0,  "50-57": 66.0},
        2: {"18-39": 32.0,  "40-49": 56.0,  "50-57": 80.0},
        3: {"18-39": 40.0,  "40-49": 68.0,  "50-57": 98.0},
        4: {"18-39": None,  "40-49": None,  "50-57": None},
    },
    "C_90_90": {
        1: {"18-39": 20.0,  "40-49": 36.0,  "50-57": 54.0},
        2: {"18-39": 26.0,  "40-49": 42.0,  "50-57": 66.0},
        3: {"18-39": 28.0,  "40-49": 52.0,  "50-57": 78.0},
        4: {"18-39": 40.0,  "40-49": 76.0,  "50-57": 96.0},
    },
    "D_30S_0A": {
        1: {"18-39": 50.70,  "40-49": 85.70,  "50-57": 118.2},
        2: {"18-39": 55.80,  "40-49": 93.80,  "50-57": 132.8},
        3: {"18-39": 67.71,  "40-49": 107.71, "50-57": 152.71},
        4: {"18-39": None,   "40-49": None,   "50-57": None},
    },
    "E_60S_0A": {
        1: {"18-39": 39.88,  "40-49": 62.38,  "50-57": 87.38},
        2: {"18-39": 47.93,  "40-49": 77.93,  "50-57": 107.93},
        3: {"18-39": 62.75,  "40-49": 96.58,  "50-57": 134.08},
        4: {"18-39": None,   "40-49": None,   "50-57": None},
    },
    "F_90S_0A": {
        1: {"18-39": 31.50,  "40-49": 51.50,  "50-57": 74.0},
        2: {"18-39": 43.50,  "40-49": 63.06,  "50-57": 93.06},
        3: {"18-39": 65.43,  "40-49": 80.44,  "50-57": 112.94},
        4: {"18-39": 81.80,  "40-49": 114.30, "50-57": 139.3},
    },
    "G_30S_14A": {
        1: {"18-39": 45.55,  "40-49": 80.55,  "50-57": 113.05},
        2: {"18-39": 49.33,  "40-49": 84.33,  "50-57": 124.33},
        3: {"18-39": 55.36,  "40-49": 95.36,  "50-57": 140.36},
        4: {"18-39": None,   "40-49": None,   "50-57": None},
    },
    "H_60S_14A": {
        1: {"18-39": 34.68,  "40-49": 57.18,  "50-57": 82.18},
        2: {"18-39": 39.48,  "40-49": 69.48,  "50-57": 99.48},
        3: {"18-39": 50.65,  "40-49": 84.23,  "50-57": 121.73},
        4: {"18-39": None,   "40-49": None,   "50-57": None},
    },
    "I_90S_14A": {
        1: {"18-39": 26.30,  "40-49": 46.30,  "50-57": 68.6},
        2: {"18-39": 37.11,  "40-49": 54.61,  "50-57": 84.61},
        3: {"18-39": 53.09,  "40-49": 68.09,  "50-57": 100.59},
        4: {"18-39": 66.36,  "40-49": 98.86,  "50-57": 123.86},
    },
}

EP_LABELS = {
    "A_30_30":   "30-day elimination period (Sickness & Accident)",
    "B_60_60":   "60-day elimination period (Sickness & Accident)",
    "C_90_90":   "90-day elimination period (Sickness & Accident)",
    "D_30S_0A":  "30-day S / 0-day A elimination period",
    "E_60S_0A":  "60-day S / 0-day A elimination period",
    "F_90S_0A":  "90-day S / 0-day A elimination period",
    "G_30S_14A": "30-day S / 14-day A elimination period",
    "H_60S_14A": "60-day S / 14-day A elimination period",
    "I_90S_14A": "90-day S / 14-day A elimination period",
}

# ── A&S In-Hospital Income 67C (with CC) & 67D (without CC): per $100/wk ─────
# {sex: {age_band: rate}}
RATES_67C = {
    "M": {"1-19": 42.0, "20-39": 60.0, "40-49": 75.0,  "50-59": 84.0},
    "F": {"1-19": 42.0, "20-39": 72.0, "40-49": 90.0,  "50-59": 100.0},
}
RATES_67D = {
    "M": {"1-19": 28.0, "20-39": 40.0, "40-49": 50.0,  "50-59": 56.0},
    "F": {"1-19": 28.0, "20-39": 48.0, "40-49": 60.0,  "50-59": 67.0},
}

# ── Surgical Expense 77B: per $1,000 benefit ──────────────────────────────────
RATES_77B = {
    "M": {"1-19": 47.5, "20-39": 51.0,  "40-49": 75.5,  "50-59": 114.5},
    "F": {"1-19": 47.5, "20-39": 108.5, "40-49": 132.5, "50-59": 132.5},
}

# ── Accident Annuity 78C & 78B: per $1,000 monthly benefit ───────────────────
RATES_78C = {1: 320.0, 2: 432.0, 3: 728.0}   # 78C = AD&D with PTD
RATES_78B = {1: 240.0, 2: 320.0, 3: 528.0}   # 78B = AD&D only

# ── Level Term Life 69L: per $1,000 FA ───────────────────────────────────────
RATES_69L = {"5-40": 3.5, "41-50": 7.0, "51-55": 12.0}

# ── Critical Illness: annual rate per $1,000, by age and sex (M, F) ──────────
RATES_CI = {
    5:  (0.96,  0.72),   6:  (0.96,  0.72),   7:  (0.96,  0.72),
    8:  (0.96,  0.72),   9:  (0.96,  0.72),   10: (0.96,  0.72),
    11: (0.96,  0.72),   12: (0.96,  0.72),   13: (0.96,  0.72),
    14: (0.96,  0.72),   15: (0.96,  0.72),   16: (0.96,  0.72),
    17: (0.96,  0.72),   18: (0.96,  0.72),   19: (1.00,  0.77),
    20: (1.05,  0.81),   21: (1.10,  0.86),   22: (1.11,  0.87),
    23: (1.12,  0.88),   24: (1.14,  0.95),   25: (1.19,  1.01),
    26: (1.22,  1.06),   27: (1.29,  1.14),   28: (1.37,  1.24),
    29: (1.46,  1.35),   30: (1.57,  1.47),   31: (1.70,  1.62),
    32: (1.86,  1.78),   33: (2.04,  1.96),   34: (2.26,  2.18),
    35: (2.51,  2.41),   36: (2.77,  2.67),   37: (3.05,  2.97),
    38: (3.35,  3.30),   39: (3.70,  3.65),   40: (4.07,  4.04),
    41: (4.50,  4.44),   42: (4.96,  4.85),   43: (5.48,  5.29),
    44: (6.06,  5.75),   45: (6.70,  6.23),   46: (7.41,  6.74),
    47: (8.19,  7.26),   48: (9.05,  7.81),   49: (9.99,  8.37),
    50: (11.03, 8.96),   51: (12.16, 9.57),   52: (14.00, 10.67),
    53: (16.06, 11.86),  54: (18.37, 13.16),  55: (20.95, 14.56),
    56: (23.83, 16.09),  57: (27.03, 17.76),  58: (30.54, 19.58),
    59: (34.40, 21.60),  60: (38.60, 23.86),  61: (43.18, 26.34),
}

# ── Cancer Care Cover: monthly rates by plan, age band, coverage type ─────────
# Plans: A = Essential Shield, B = Premiere Guard, C = Elite Armour
# Coverage types: Individual, Single_Parent, Husband_Wife, Full_Family
RATES_CANCER_CARE = {
    "A": {
        "1-39":  {"Individual": 161.0, "Single_Parent": 205.0, "Husband_Wife": 247.0, "Full_Family": 265.0},
        "40-49": {"Individual": 202.0, "Single_Parent": 246.0, "Husband_Wife": 339.0, "Full_Family": 351.0},
        "50-55": {"Individual": 290.0, "Single_Parent": 334.0, "Husband_Wife": 515.0, "Full_Family": 513.0},
    },
    "B": {
        "1-39":  {"Individual": 251.0, "Single_Parent": 336.0, "Husband_Wife": 419.0, "Full_Family": 459.0},
        "40-49": {"Individual": 331.0, "Single_Parent": 416.0, "Husband_Wife": 598.0, "Full_Family": 627.0},
        "50-55": {"Individual": 502.0, "Single_Parent": 588.0, "Husband_Wife": 940.0, "Full_Family": 943.0},
    },
    "C": {
        "1-39":  {"Individual": 412.0, "Single_Parent": 577.0, "Husband_Wife": 725.0,  "Full_Family": 809.0},
        "40-49": {"Individual": 554.0, "Single_Parent": 718.0, "Husband_Wife": 1043.0, "Full_Family": 1105.0},
        "50-55": {"Individual": 870.0, "Single_Parent": 1034.0,"Husband_Wife": 1675.0, "Full_Family": 1684.0},
    },
}
CANCER_CARE_CHILD_RIDER = {"A": 36.0, "B": 70.0, "C": 136.0}  # monthly

# Cancer Care Plus - Plan C: Standard Care — fixed annual premium
RATE_CANCER_CARE_PLUS_C = 4944.0  # TTD/year

# ── Total Protector: annual rate per unit per person, by age band ─────────────
RATES_TOTAL_PROTECTOR = {"0-39": 540.0, "40-49": 660.0, "50-59": 900.0}

# ── Super Family Protector: annual rate per unit per person, by age band ──────
RATES_SUPER_FAMILY = {"0-39": 480.0, "40-49": 660.0, "50-59": 840.0}

# ── Personal Protector: annual rate per unit, by sex/class/age band ───────────
# Note: "Para Mensual dividir por 11" (divide by 11 for monthly, not 12)
RATES_PP_MALE = {
    1: {"0-39": 242.0, "40-44": 286.0, "45-49": 352.0, "50-55": 495.0},
    2: {"0-39": 352.0, "40-44": 407.0, "45-49": 495.0, "50-55": 671.0},
    3: {"0-39": 473.0, "40-44": 550.0, "45-49": 627.0, "50-55": 847.0},
}
RATES_PP_FEMALE = {
    1: {"0-39": 363.0, "40-44": 440.0, "45-49": 528.0, "50-55": 748.0},
    2: {"0-39": 528.0, "40-44": 616.0, "45-49": 748.0, "50-55": 1001.0},
    3: {"0-39": 715.0, "40-44": 814.0, "45-49": 946.0, "50-55": 1276.0},
}

# ── Life Support Standard Option: monthly rate, by sex/age band/plan tier ─────
RATES_LS_STANDARD = {
    "M": {
        "1-12":  {"Platinum": 68.99,   "Gold": 34.49,  "Silver": 17.25},
        "13-19": {"Platinum": 76.03,   "Gold": 38.01,  "Silver": 19.01},
        "20-24": {"Platinum": 72.00,   "Gold": 36.00,  "Silver": 18.00},
        "25-29": {"Platinum": 73.34,   "Gold": 36.67,  "Silver": 18.34},
        "30-34": {"Platinum": 84.00,   "Gold": 42.00,  "Silver": 21.00},
        "35-39": {"Platinum": 121.98,  "Gold": 60.99,  "Silver": 30.49},
        "40-44": {"Platinum": 195.40,  "Gold": 97.70,  "Silver": 48.85},
        "45-49": {"Platinum": 305.19,  "Gold": 152.59, "Silver": 76.30},
        "50-54": {"Platinum": 510.98,  "Gold": 255.49, "Silver": 127.75},
        "55-59": {"Platinum": 827.48,  "Gold": 413.74, "Silver": 206.87},
        "60-64": {"Platinum": 1263.73, "Gold": 631.86, "Silver": 315.93},
    },
    "F": {
        "1-12":  {"Platinum": 93.85,   "Gold": 46.92,  "Silver": 23.46},
        "13-19": {"Platinum": 100.88,  "Gold": 50.44,  "Silver": 25.22},
        "20-24": {"Platinum": 92.47,   "Gold": 46.23,  "Silver": 23.12},
        "25-29": {"Platinum": 91.36,   "Gold": 45.68,  "Silver": 22.84},
        "30-34": {"Platinum": 101.09,  "Gold": 50.55,  "Silver": 25.27},
        "35-39": {"Platinum": 134.96,  "Gold": 67.48,  "Silver": 33.74},
        "40-44": {"Platinum": 195.37,  "Gold": 97.69,  "Silver": 48.84},
        "45-49": {"Platinum": 264.83,  "Gold": 132.42, "Silver": 66.21},
        "50-54": {"Platinum": 365.98,  "Gold": 182.99, "Silver": 91.49},
        "55-59": {"Platinum": 517.99,  "Gold": 259.00, "Silver": 129.50},
        "60-64": {"Platinum": 684.09,  "Gold": 342.05, "Silver": 171.02},
    },
}

# ── Life Support Enhanced Option: monthly rate, by sex/age band/plan tier ─────
RATES_LS_ENHANCED = {
    "M": {
        "1-12":  {"Platinum": 98.36,   "Gold": 49.18,  "Silver": 24.59},
        "13-19": {"Platinum": 103.22,  "Gold": 51.61,  "Silver": 25.80},
        "20-24": {"Platinum": 99.44,   "Gold": 49.72,  "Silver": 24.86},
        "25-29": {"Platinum": 101.47,  "Gold": 50.73,  "Silver": 25.37},
        "30-34": {"Platinum": 108.00,  "Gold": 54.00,  "Silver": 27.00},
        "35-39": {"Platinum": 154.92,  "Gold": 77.46,  "Silver": 38.73},
        "40-44": {"Platinum": 253.27,  "Gold": 126.64, "Silver": 63.32},
        "45-49": {"Platinum": 402.12,  "Gold": 201.06, "Silver": 100.53},
        "50-54": {"Platinum": 695.79,  "Gold": 347.90, "Silver": 173.95},
        "55-59": {"Platinum": 1178.04, "Gold": 589.02, "Silver": 294.51},
        "60-64": {"Platinum": 1850.42, "Gold": 925.21, "Silver": 462.60},
    },
    "F": {
        "1-12":  {"Platinum": 167.28,  "Gold": 83.64,  "Silver": 41.82},
        "13-19": {"Platinum": 171.57,  "Gold": 85.79,  "Silver": 42.89},
        "20-24": {"Platinum": 163.53,  "Gold": 81.77,  "Silver": 40.88},
        "25-29": {"Platinum": 163.23,  "Gold": 81.62,  "Silver": 40.81},
        "30-34": {"Platinum": 168.72,  "Gold": 84.36,  "Silver": 42.18},
        "35-39": {"Platinum": 245.21,  "Gold": 122.61, "Silver": 61.30},
        "40-44": {"Platinum": 381.44,  "Gold": 190.72, "Silver": 95.36},
        "45-49": {"Platinum": 534.96,  "Gold": 267.48, "Silver": 133.74},
        "50-54": {"Platinum": 740.29,  "Gold": 370.14, "Silver": 185.07},
        "55-59": {"Platinum": 1024.43, "Gold": 512.21, "Silver": 256.11},
        "60-64": {"Platinum": 1302.22, "Gold": 651.11, "Silver": 325.55},
    },
}

# ── Supreme Family Protector: annual premium by type, plan, age band ──────────
RATES_SUPREME_SINGLE = {
    "0-39":  {"I": 725.53,   "II": 1256.78, "III": 1554.10, "IV": 2018.39},
    "40-49": {"I": 983.02,   "II": 1727.52, "III": 2095.91, "IV": 2702.36},
    "50-59": {"I": 1417.06,  "II": 2356.23, "III": 2789.52, "IV": 3525.76},
}
RATES_SUPREME_FAMILY = {
    "0-39":  {"I": 889.89,   "II": 1503.82, "III": 1863.80, "IV": 2415.11},
    "40-49": {"I": 1199.63,  "II": 2040.30, "III": 2475.87, "IV": 3178.33},
    "50-59": {"I": 1750.82,  "II": 2794.27, "III": 3297.43, "IV": 4135.08},
}


# ── Helper: age-band lookup ───────────────────────────────────────────────────
def _age_band(age: int, bands: dict) -> str | None:
    """Return the matching age-band key from a dict keyed by 'lo-hi' strings."""
    for band in bands:
        lo, hi = (int(x) for x in band.split("-"))
        if lo <= age <= hi:
            return band
    return None
