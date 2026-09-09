-- Migration: 004_arenas.sql

CREATE TABLE arenas (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status              arena_status NOT NULL DEFAULT 'pending',
  max_participants    smallint NOT NULL DEFAULT 2 CHECK (max_participants BETWEEN 2 AND 8),
  max_rounds          smallint NOT NULL DEFAULT 5  CHECK (max_rounds BETWEEN 1 AND 20),
  time_limit_seconds  int NOT NULL DEFAULT 30      CHECK (time_limit_seconds BETWEEN 5 AND 300),
  category            text,
  difficulty          question_difficulty,
  scheduled_start_at  timestamptz,
  started_at          timestamptz,
  completed_at        timestamptz,
  metadata            jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_arenas_host_user_id ON arenas(host_user_id);
CREATE INDEX idx_arenas_status ON arenas(status);
CREATE INDEX idx_arenas_created_at ON arenas(created_at DESC);

CREATE TRIGGER trg_arenas_updated_at
  BEFORE UPDATE ON arenas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE arena_invites (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id        uuid NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  inviter_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  invitee_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status          invite_status NOT NULL DEFAULT 'pending',
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  responded_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_arena_invites_arena_invitee UNIQUE (arena_id, invitee_id),
  CONSTRAINT chk_inviter_not_invitee CHECK (inviter_id <> invitee_id)
);

CREATE INDEX idx_arena_invites_arena_id ON arena_invites(arena_id);
CREATE INDEX idx_arena_invites_invitee_id ON arena_invites(invitee_id);
CREATE INDEX idx_arena_invites_status ON arena_invites(status);

CREATE TRIGGER trg_arena_invites_updated_at
  BEFORE UPDATE ON arena_invites
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE arena_participants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id        uuid NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status          participant_status NOT NULL DEFAULT 'invited',
  joined_at       timestamptz,
  eliminated_at   timestamptz,
  final_rank      smallint,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_arena_participants_arena_user UNIQUE (arena_id, user_id),
  CONSTRAINT chk_final_rank_positive CHECK (final_rank IS NULL OR final_rank > 0)
);

CREATE INDEX idx_arena_participants_arena_id ON arena_participants(arena_id);
CREATE INDEX idx_arena_participants_user_id ON arena_participants(user_id);
CREATE INDEX idx_arena_participants_status ON arena_participants(status);

CREATE TRIGGER trg_arena_participants_updated_at
  BEFORE UPDATE ON arena_participants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
