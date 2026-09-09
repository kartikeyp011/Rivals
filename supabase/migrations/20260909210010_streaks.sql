-- Migration: 010_streaks.sql

CREATE TABLE streaks (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak      int NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak      int NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_date  date,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_streaks_user UNIQUE (user_id)
);

CREATE TRIGGER trg_streaks_updated_at
  BEFORE UPDATE ON streaks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
