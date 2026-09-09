-- Migration: 006_arena_scores.sql

CREATE TABLE arena_scores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id        uuid NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  round_id        uuid NOT NULL REFERENCES arena_rounds(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  points_earned   int NOT NULL DEFAULT 0,
  bonus_points    int NOT NULL DEFAULT 0,
  total_points    int GENERATED ALWAYS AS (points_earned + bonus_points) STORED,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_arena_scores_round_user UNIQUE (round_id, user_id),
  CONSTRAINT chk_points_non_negative CHECK (points_earned >= 0 AND bonus_points >= 0)
);

CREATE INDEX idx_arena_scores_arena_id ON arena_scores(arena_id);
CREATE INDEX idx_arena_scores_user_id ON arena_scores(user_id);

CREATE TABLE arena_results (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id            uuid NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  final_rank          smallint NOT NULL CHECK (final_rank > 0),
  total_score         int NOT NULL DEFAULT 0,
  rounds_won          smallint NOT NULL DEFAULT 0,
  rounds_played       smallint NOT NULL DEFAULT 0,
  coins_awarded       int NOT NULL DEFAULT 0,
  is_winner           boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_arena_results_arena_user UNIQUE (arena_id, user_id)
);

CREATE INDEX idx_arena_results_arena_id ON arena_results(arena_id);
CREATE INDEX idx_arena_results_user_id ON arena_results(user_id);
