-- Migration: 008_coins.sql

CREATE TABLE coin_ledger (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  type            coin_ledger_type NOT NULL,
  reason          coin_ledger_reason NOT NULL,
  amount          int NOT NULL CHECK (amount > 0),
  balance_after   int NOT NULL CHECK (balance_after >= 0),
  reference_id    uuid,
  reference_table text,
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_coin_ledger_user_id ON coin_ledger(user_id);
CREATE INDEX idx_coin_ledger_reference_id ON coin_ledger(reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX idx_coin_ledger_created_at ON coin_ledger(created_at DESC);
