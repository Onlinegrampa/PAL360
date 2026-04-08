-- PAL360 Railway Schema v2
-- Plain PostgreSQL — no Supabase extensions needed
-- NOTE: This is for reference only.
-- The app creates tables automatically on first boot via main.py
-- Run this manually only if you need to reset the database.

-- Drop existing tables (careful — this deletes all data)
-- DROP TABLE IF EXISTS payments, claims, policies, products, clients CASCADE;

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
    line            TEXT NOT NULL CHECK (line IN ('Life', 'Health', 'Annuities', 'PA&S')),
    status          TEXT NOT NULL CHECK (status IN ('IN-FORCE', 'LAPSED', 'PENDING')),
    premium         NUMERIC(12,2) NOT NULL,
    due_date        TIMESTAMPTZ NOT NULL,
    coverage_amount NUMERIC(14,2) NOT NULL,
    start_date      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claims (
    claim_id       TEXT PRIMARY KEY,
    policy_id      TEXT NOT NULL REFERENCES policies(policy_id),
    stage          TEXT NOT NULL CHECK (stage IN ('Submitted', 'Agent Review', 'Claims Dept', 'Finance', 'Paid')),
    timestamps     JSONB NOT NULL DEFAULT '[]',
    est_resolution TIMESTAMPTZ NOT NULL,
    amount         NUMERIC(12,2) NOT NULL,
    description    TEXT NOT NULL,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    product_id TEXT PRIMARY KEY,
    line       TEXT NOT NULL CHECK (line IN ('Life', 'Health', 'Annuities', 'PA&S')),
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
    status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policies_client ON policies(client_id);
CREATE INDEX IF NOT EXISTS idx_claims_policy   ON claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_payments_policy ON payments(policy_id);
