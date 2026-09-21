-- Migration: 021_weekly_bonus.sql

ALTER TYPE coin_ledger_reason ADD VALUE IF NOT EXISTS 'weekly_bonus';

CREATE TABLE rivals_plus_weekly_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  coins_awarded int NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_weekly_claim UNIQUE (user_id, period_start)
);

ALTER TABLE rivals_plus_weekly_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own weekly claims"
  ON rivals_plus_weekly_claims FOR SELECT
  USING (auth.uid() = user_id);
