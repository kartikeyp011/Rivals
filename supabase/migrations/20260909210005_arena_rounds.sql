-- Migration: 005_arena_rounds.sql

CREATE TABLE arena_rounds (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id        uuid NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  question_id     uuid NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  round_number    smallint NOT NULL CHECK (round_number > 0),
  status          round_status NOT NULL DEFAULT 'pending',
  started_at      timestamptz,
  ends_at         timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_arena_rounds_arena_round_number UNIQUE (arena_id, round_number)
);

CREATE INDEX idx_arena_rounds_arena_id ON arena_rounds(arena_id);
CREATE INDEX idx_arena_rounds_status ON arena_rounds(status);

CREATE TRIGGER trg_arena_rounds_updated_at
  BEFORE UPDATE ON arena_rounds
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE arena_attempts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id        uuid NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  round_id        uuid NOT NULL REFERENCES arena_rounds(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  selected_option text,
  is_correct      boolean,
  response_ms     int,
  status          attempt_status NOT NULL DEFAULT 'in_progress',
  submitted_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_arena_attempts_round_user UNIQUE (round_id, user_id)
);

CREATE INDEX idx_arena_attempts_arena_id ON arena_attempts(arena_id);
CREATE INDEX idx_arena_attempts_round_id ON arena_attempts(round_id);
CREATE INDEX idx_arena_attempts_user_id ON arena_attempts(user_id);

CREATE TRIGGER trg_arena_attempts_updated_at
  BEFORE UPDATE ON arena_attempts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
