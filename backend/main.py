import os
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from db import init_pool, close_pool, get_pool
from auth import hash_password
from routes.auth import router as auth_router
from routes.policies import router as policies_router
from routes.claims import router as claims_router
from routes.products import router as products_router
from routes.payments import router as payments_router

load_dotenv()


# ── Database setup + auto-seed ─────────────────────────────────────────────────

async def _create_tables(pool):
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS clients (
                client_id     TEXT PRIMARY KEY,
                name          TEXT NOT NULL,
                email         TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                cert_hash     TEXT,
                created_at    TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS policies (
                policy_id       TEXT PRIMARY KEY,
                client_id       TEXT NOT NULL REFERENCES clients(client_id),
                line            TEXT NOT NULL,
                status          TEXT NOT NULL,
                premium         NUMERIC(12,2) NOT NULL,
                due_date        TIMESTAMPTZ NOT NULL,
                coverage_amount NUMERIC(14,2) NOT NULL,
                start_date      TIMESTAMPTZ NOT NULL,
                created_at      TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS claims (
                claim_id       TEXT PRIMARY KEY,
                policy_id      TEXT NOT NULL REFERENCES policies(policy_id),
                stage          TEXT NOT NULL,
                timestamps     JSONB NOT NULL DEFAULT '[]',
                est_resolution TIMESTAMPTZ NOT NULL,
                amount         NUMERIC(12,2) NOT NULL,
                description    TEXT NOT NULL,
                created_at     TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS products (
                product_id TEXT PRIMARY KEY,
                line       TEXT NOT NULL,
                name       TEXT NOT NULL,
                benefits   JSONB NOT NULL DEFAULT '[]',
                cost_range TEXT NOT NULL,
                use_case   TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS payments (
                payment_id TEXT PRIMARY KEY,
                policy_id  TEXT NOT NULL REFERENCES policies(policy_id),
                amount     NUMERIC(12,2) NOT NULL,
                wipay_ref  TEXT,
                status     TEXT NOT NULL DEFAULT 'pending',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)


async def _seed_if_empty(pool):
    """Insert demo data on first boot if the database is empty."""
    async with pool.acquire() as conn:
        count = await conn.fetchval("SELECT COUNT(*) FROM clients")
        if count > 0:
            return  # Already seeded — skip

        demo_pw = os.getenv("DEMO_PASSWORD", "Demo@PAL360!")
        pw_hash = hash_password(demo_pw)

        # ── Clients ────────────────────────────────────────────────────────────
        await conn.executemany(
            "INSERT INTO clients (client_id, name, email, password_hash, cert_hash) VALUES ($1,$2,$3,$4,$5)",
            [
                ("CLI-001", "Marcus Williams",  "marcus.williams@demo.pal360.tt",  pw_hash, "sha256:mock_mw001"),
                ("CLI-002", "Priya Ramkissoon", "priya.ramkissoon@demo.pal360.tt", pw_hash, "sha256:mock_pr002"),
                ("CLI-003", "Jerome Alexander", "jerome.alexander@demo.pal360.tt", pw_hash, "sha256:mock_ja003"),
            ],
        )

        # ── Policies ───────────────────────────────────────────────────────────
        await conn.executemany(
            """INSERT INTO policies
               (policy_id, client_id, line, status, premium, due_date, coverage_amount, start_date)
               VALUES ($1,$2,$3,$4,$5,$6::timestamptz,$7,$8::timestamptz)""",
            [
                # Marcus — all 4 lines
                ("PAL-TT-2019-001", "CLI-001", "Life",      "IN-FORCE", 2400, "2026-04-20", 500000, "2019-03-01"),
                ("PAL-TT-2021-044", "CLI-001", "Health",    "IN-FORCE", 1800, "2026-05-01", 100000, "2021-07-15"),
                ("PAL-TT-2018-007", "CLI-001", "Annuities", "IN-FORCE", 6000, "2026-06-01", 250000, "2018-01-10"),
                ("PAL-TT-2022-112", "CLI-001", "PA&S",      "LAPSED",    900, "2025-11-01",  75000, "2022-09-01"),
                # Priya
                ("PAL-TT-2020-055", "CLI-002", "Life",   "IN-FORCE", 1800, "2026-04-25", 300000, "2020-05-01"),
                ("PAL-TT-2023-088", "CLI-002", "Health", "IN-FORCE", 1200, "2026-05-15",  80000, "2023-02-01"),
                # Jerome
                ("PAL-TT-2017-003", "CLI-003", "Life", "IN-FORCE", 3000, "2026-04-30", 750000, "2017-06-01"),
            ],
        )

        # ── Claims ─────────────────────────────────────────────────────────────
        await conn.executemany(
            """INSERT INTO claims
               (claim_id, policy_id, stage, timestamps, est_resolution, amount, description)
               VALUES ($1,$2,$3,$4::jsonb,$5::timestamptz,$6,$7)""",
            [
                (
                    "CLM-2026-001", "PAL-TT-2021-044", "Claims Dept",
                    json.dumps([
                        {"stage": "Submitted",    "ts": "2026-03-15T09:00:00"},
                        {"stage": "Agent Review", "ts": "2026-03-17T11:30:00"},
                        {"stage": "Claims Dept",  "ts": "2026-03-21T14:00:00"},
                    ]),
                    "2026-04-15", 4500.00,
                    "Emergency hospitalization — St. Clair Medical Centre",
                ),
                (
                    "CLM-2025-089", "PAL-TT-2019-001", "Paid",
                    json.dumps([
                        {"stage": "Submitted",    "ts": "2025-10-01T08:00:00"},
                        {"stage": "Agent Review", "ts": "2025-10-03T10:00:00"},
                        {"stage": "Claims Dept",  "ts": "2025-10-07T13:00:00"},
                        {"stage": "Finance",      "ts": "2025-10-10T09:00:00"},
                        {"stage": "Paid",         "ts": "2025-10-14T16:00:00"},
                    ]),
                    "2025-10-14", 12000.00,
                    "Critical illness benefit — Type 2 Diabetes diagnosis",
                ),
            ],
        )

        # ── Products ───────────────────────────────────────────────────────────
        await conn.executemany(
            "INSERT INTO products (product_id, line, name, benefits, cost_range, use_case) VALUES ($1,$2,$3,$4::jsonb,$5,$6)",
            [
                (
                    "PROD-LIFE-001", "Life", "SecureFuture Whole Life",
                    json.dumps([
                        "Guaranteed death benefit from day one",
                        "Cash value accumulation with tax advantages",
                        "Dividends reinvested to grow coverage",
                        "Policy loans available at any time",
                    ]),
                    "$80–$250/month",
                    "Build lifelong protection and a growing cash asset for your family.",
                ),
                (
                    "PROD-HEALTH-001", "Health", "MedShield Comprehensive",
                    json.dumps([
                        "In-patient and out-patient coverage",
                        "Specialist consultations included",
                        "Prescription drug benefit",
                        "Emergency medical evacuation",
                    ]),
                    "$120–$400/month",
                    "Protect against the rising cost of healthcare for you and your family.",
                ),
                (
                    "PROD-ANNUITY-001", "Annuities", "RetireWell Fixed Annuity",
                    json.dumps([
                        "Guaranteed monthly income in retirement",
                        "Flexible payout periods (10, 20, lifetime)",
                        "Inflation rider available",
                        "Beneficiary death benefit",
                    ]),
                    "$300–$1,000/month",
                    "Secure predictable retirement income you cannot outlive.",
                ),
                (
                    "PROD-PAS-001", "PA&S", "HomeGuard Property & Savings",
                    json.dumps([
                        "Property damage and loss coverage",
                        "Personal accident benefit",
                        "Savings component with guaranteed returns",
                        "Hurricane and flood rider available",
                    ]),
                    "$60–$180/month",
                    "Protect your home and assets while building emergency savings.",
                ),
            ],
        )


# ── App lifecycle ──────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    pool = await init_pool()
    await _create_tables(pool)
    await _seed_if_empty(pool)
    yield
    await close_pool()


# ── FastAPI app ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="PAL360 API",
    description="Pan American Life Client Dashboard — v2 (Railway + PostgreSQL)",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — allow Railway frontend URL + local dev
FRONTEND_URL = os.getenv("FRONTEND_URL", "")
origins = [
    "http://localhost:3000",
    "http://localhost:4001",
]
if FRONTEND_URL:
    origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.up\.railway\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,     tags=["auth"])
app.include_router(policies_router, tags=["policies"])
app.include_router(claims_router,   tags=["claims"])
app.include_router(products_router, tags=["products"])
app.include_router(payments_router, tags=["payments"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "PAL360 API v2"}
