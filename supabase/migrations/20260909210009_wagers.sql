-- Migration: 009_wagers.sql

CREATE TABLE wagers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id        uuid NOT NULL REFERENCES arenas(id) ON DELETE RESTRICT,
  created_by      uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status          wager_status NOT NULL DEFAULT 'open',
  coin_amount     int NOT NULL CHECK (coin_amount > 0),
  total_pot       int NOT NULL DEFAULT 0,
  settled_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_wagers_arena UNIQUE (arena_id)
);

CREATE INDEX idx_wagers_arena_id ON wagers(arena_id);
CREATE INDEX idx_wagers_status ON wagers(status);

CREATE TRIGGER trg_wagers_updated_at
  BEFORE UPDATE ON wagers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE wager_participants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wager_id        uuid NOT NULL REFERENCES wagers(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  coin_amount     int NOT NULL CHECK (coin_amount > 0),
  coins_won       int,
  joined_at       timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_wager_participants_wager_user UNIQUE (wager_id, user_id)
);

CREATE INDEX idx_wager_participants_wager_id ON wager_participants(wager_id);
CREATE INDEX idx_wager_participants_user_id ON wager_participants(user_id);
