-- PAL360 Initial Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- CLIENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS clients (
  client_id   TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  cert_hash   TEXT,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_own_row" ON clients
  FOR ALL USING (auth.uid() = user_id);

-- =========================================================
-- POLICIES
-- =========================================================
CREATE TABLE IF NOT EXISTS policies (
  policy_id        TEXT PRIMARY KEY,
  client_id        TEXT NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
  line             TEXT NOT NULL CHECK (line IN ('Life', 'Health', 'Annuities', 'PA&S')),
  status           TEXT NOT NULL CHECK (status IN ('IN-FORCE', 'LAPSED', 'PENDING')),
  premium          NUMERIC(12, 2) NOT NULL,
  due_date         TIMESTAMPTZ NOT NULL,
  coverage_amount  NUMERIC(14, 2) NOT NULL,
  start_date       TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policies_own_client" ON policies
  FOR ALL USING (
    client_id IN (
      SELECT client_id FROM clients WHERE user_id = auth.uid()
    )
  );

-- =========================================================
-- CLAIMS
-- =========================================================
CREATE TABLE IF NOT EXISTS claims (
  claim_id        TEXT PRIMARY KEY,
  policy_id       TEXT NOT NULL REFERENCES policies(policy_id) ON DELETE CASCADE,
  stage           TEXT NOT NULL CHECK (stage IN ('Submitted', 'Agent Review', 'Claims Dept', 'Finance', 'Paid')),
  timestamps      JSONB NOT NULL DEFAULT '[]',
  est_resolution  TIMESTAMPTZ NOT NULL,
  amount          NUMERIC(12, 2) NOT NULL,
  description     TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "claims_own_policy" ON claims
  FOR ALL USING (
    policy_id IN (
      SELECT policy_id FROM policies
      WHERE client_id IN (
        SELECT client_id FROM clients WHERE user_id = auth.uid()
      )
    )
  );

-- =========================================================
-- PAYMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS payments (
  payment_id        TEXT PRIMARY KEY DEFAULT ('PAY-' || uuid_generate_v4()::text),
  policy_id         TEXT NOT NULL REFERENCES policies(policy_id),
  amount_cents      INTEGER NOT NULL,
  stripe_intent_id  TEXT,
  status            TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_own_policy" ON payments
  FOR ALL USING (
    policy_id IN (
      SELECT policy_id FROM policies
      WHERE client_id IN (
        SELECT client_id FROM clients WHERE user_id = auth.uid()
      )
    )
  );

-- =========================================================
-- INDEXES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_policies_client ON policies(client_id);
CREATE INDEX IF NOT EXISTS idx_claims_policy ON claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_payments_policy ON payments(policy_id);
CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
