-- Migration: 011_leaderboards.sql

CREATE TABLE leaderboards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period          text NOT NULL,
  period_key      text NOT NULL,
  score           int NOT NULL DEFAULT 0,
  rank            int,
  arenas_played   int NOT NULL DEFAULT 0,
  arenas_won      int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_leaderboards_user_period UNIQUE (user_id, period, period_key)
);

CREATE INDEX idx_leaderboards_period_key ON leaderboards(period, period_key, score DESC);

CREATE TRIGGER trg_leaderboards_updated_at
  BEFORE UPDATE ON leaderboards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
