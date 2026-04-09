import os
import json
from contextlib import asynccontextmanager
from datetime import datetime, timezone
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
from routes.fact_finds import router as fact_finds_router
from routes.applications import router as applications_router
from routes.agents import router as agents_router
from routes.policy_statements import router as statements_router

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

            CREATE TABLE IF NOT EXISTS agents (
                agent_id    TEXT PRIMARY KEY,
                name        TEXT NOT NULL,
                title       TEXT NOT NULL,
                email       TEXT NOT NULL,
                phone       TEXT NOT NULL,
                whatsapp    TEXT NOT NULL,
                bio         TEXT NOT NULL,
                specialties TEXT[] NOT NULL DEFAULT '{}',
                photo_initials TEXT NOT NULL DEFAULT 'AG',
                is_active   BOOLEAN NOT NULL DEFAULT true,
                created_at  TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS agent_requests (
                id         SERIAL PRIMARY KEY,
                client_id  TEXT NOT NULL UNIQUE REFERENCES clients(client_id),
                agent_id   TEXT NOT NULL REFERENCES agents(agent_id),
                message    TEXT NOT NULL DEFAULT '',
                status     TEXT NOT NULL DEFAULT 'pending',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS applications (
                id                       SERIAL PRIMARY KEY,
                app_ref                  TEXT UNIQUE NOT NULL,
                client_id                TEXT NOT NULL REFERENCES clients(client_id),
                product_id               TEXT NOT NULL,
                product_name             TEXT NOT NULL,
                full_name                TEXT NOT NULL,
                date_of_birth            TEXT NOT NULL,
                address                  TEXT NOT NULL,
                phone                    TEXT NOT NULL,
                occupation               TEXT NOT NULL,
                smoker                   BOOLEAN NOT NULL DEFAULT false,
                pre_existing_conditions  TEXT NOT NULL DEFAULT '',
                beneficiary_name         TEXT NOT NULL,
                beneficiary_relationship TEXT NOT NULL,
                beneficiary_phone        TEXT NOT NULL,
                status                   TEXT NOT NULL DEFAULT 'under_review',
                assigned_policy_number   TEXT,
                created_at               TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS fact_finds (
                id                    SERIAL PRIMARY KEY,
                client_id             TEXT NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
                annual_income         NUMERIC(14,2),
                annual_expenses       NUMERIC(14,2),
                total_debt            NUMERIC(14,2),
                num_dependents        INTEGER,
                financial_goals       TEXT,
                life_insurance_needed NUMERIC(14,2),
                current_coverage      NUMERIC(14,2),
                protection_gap        NUMERIC(14,2),
                gap_percentage        NUMERIC(6,2),
                is_current            BOOLEAN DEFAULT true,
                created_at            TIMESTAMPTZ DEFAULT NOW(),
                updated_at            TIMESTAMPTZ DEFAULT NOW()
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
        def dt(s: str):
            return datetime.fromisoformat(s).replace(tzinfo=timezone.utc)

        await conn.executemany(
            """INSERT INTO policies
               (policy_id, client_id, line, status, premium, due_date, coverage_amount, start_date)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8)""",
            [
                # Marcus — all 4 lines
                ("PAL-TT-2019-001", "CLI-001", "Life",      "IN-FORCE", 2400, dt("2026-04-20"), 500000, dt("2019-03-01")),
                ("PAL-TT-2021-044", "CLI-001", "Health",    "IN-FORCE", 1800, dt("2026-05-01"), 100000, dt("2021-07-15")),
                ("PAL-TT-2018-007", "CLI-001", "Annuities", "IN-FORCE", 6000, dt("2026-06-01"), 250000, dt("2018-01-10")),
                ("PAL-TT-2022-112", "CLI-001", "PA&S",      "LAPSED",    900, dt("2025-11-01"),  75000, dt("2022-09-01")),
                # Priya
                ("PAL-TT-2020-055", "CLI-002", "Life",   "IN-FORCE", 1800, dt("2026-04-25"), 300000, dt("2020-05-01")),
                ("PAL-TT-2023-088", "CLI-002", "Health", "IN-FORCE", 1200, dt("2026-05-15"),  80000, dt("2023-02-01")),
                # Jerome
                ("PAL-TT-2017-003", "CLI-003", "Life", "IN-FORCE", 3000, dt("2026-04-30"), 750000, dt("2017-06-01")),
            ],
        )

        # ── Claims ─────────────────────────────────────────────────────────────
        await conn.executemany(
            """INSERT INTO claims
               (claim_id, policy_id, stage, timestamps, est_resolution, amount, description)
               VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7)""",
            [
                (
                    "CLM-2026-001", "PAL-TT-2021-044", "Claims Dept",
                    json.dumps([
                        {"stage": "Submitted",    "ts": "2026-03-15T09:00:00"},
                        {"stage": "Agent Review", "ts": "2026-03-17T11:30:00"},
                        {"stage": "Claims Dept",  "ts": "2026-03-21T14:00:00"},
                    ]),
                    dt("2026-04-15"), 4500.00,
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
                    dt("2025-10-14"), 12000.00,
                    "Critical illness benefit — Type 2 Diabetes diagnosis",
                ),
            ],
        )

        # ── Agents ─────────────────────────────────────────────────────────────
        await conn.executemany(
            """INSERT INTO agents
               (agent_id, name, title, email, phone, whatsapp, bio, specialties, photo_initials)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
               ON CONFLICT (agent_id) DO NOTHING""",
            [
                (
                    "AGT-001", "Camille Joseph", "Senior Insurance Advisor",
                    "camille.joseph@pal360.tt", "+1 868 765-4321", "+18687654321",
                    "15 years helping families in T&T secure their financial future. Specialises in life and health portfolios for young professionals.",
                    ["Life Insurance", "Health Insurance", "Family Planning"], "CJ",
                ),
                (
                    "AGT-002", "Marcus Browne", "Wealth & Protection Specialist",
                    "marcus.browne@pal360.tt", "+1 868 876-5432", "+18688765432",
                    "Former banker turned insurance advisor. Expert in annuities and retirement planning for business owners and executives.",
                    ["Annuities", "Retirement Planning", "Business Insurance"], "MB",
                ),
                (
                    "AGT-003", "Priya Maharaj", "Personal Lines Consultant",
                    "priya.maharaj@pal360.tt", "+1 868 987-6543", "+18689876543",
                    "Passionate about making insurance simple and accessible. Fluent in English and Hindi. Serves clients across Trinidad and Tobago.",
                    ["PA&S", "Life Insurance", "First-time Buyers"], "PM",
                ),
            ],
        )

        # ── Products (loaded from seed file) ───────────────────────────────────
        seeds_path = os.path.join(os.path.dirname(__file__), "data", "seeds", "products.json")
        with open(seeds_path) as f:
            products_data = json.load(f)
        await conn.executemany(
            "INSERT INTO products (product_id, line, name, benefits, cost_range, use_case) VALUES ($1,$2,$3,$4::jsonb,$5,$6)",
            [
                (
                    p["product_id"], p["line"], p["name"],
                    json.dumps(p["benefits"]), p["cost_range"], p["use_case"],
                )
                for p in products_data
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
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:4001",
]
if FRONTEND_URL:
    origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://localhost:\d+|https://.*\.up\.railway\.app|https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,       tags=["auth"])
app.include_router(policies_router,   tags=["policies"])
app.include_router(claims_router,     tags=["claims"])
app.include_router(products_router,   tags=["products"])
app.include_router(payments_router,   tags=["payments"])
app.include_router(fact_finds_router,    tags=["fact-finds"])
app.include_router(applications_router, tags=["applications"])
app.include_router(agents_router,       tags=["agents"])
app.include_router(statements_router,   tags=["policy-statements"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "PAL360 API v2"}
