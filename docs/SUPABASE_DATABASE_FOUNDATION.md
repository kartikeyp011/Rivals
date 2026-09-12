# Rivals Project — Step 3: Supabase Database Foundation

## Design Document (Pre-Implementation)

---

## A. Final Recommended Database Schema

### Design Principles

- All PKs are `uuid` using `gen_random_uuid()` (no serial integers in public-facing tables)
- All tables have `created_at timestamptz NOT NULL DEFAULT now()`
- Mutable rows have `updated_at timestamptz NOT NULL DEFAULT now()` + a trigger to auto-update
- FastAPI is the only writer for all `arena_*` tables — enforced at RLS layer
- `auth.users` and `profiles` are referenced but never altered by migrations

---

### Enums

```sql
-- Migration: 001_enums.sql

CREATE TYPE arena_status AS ENUM (
  'pending',      -- created, waiting for participants
  'active',       -- round in progress
  'completed',    -- all rounds finished, results finalized
  'cancelled'     -- aborted before completion
);

CREATE TYPE invite_status AS ENUM (
  'pending',
  'accepted',
  'declined',
  'expired'
);

CREATE TYPE participant_status AS ENUM (
  'invited',
  'active',
  'eliminated',
  'withdrawn',
  'completed'
);

CREATE TYPE round_status AS ENUM (
  'pending',
  'active',
  'scoring',
  'completed'
);

CREATE TYPE attempt_status AS ENUM (
  'in_progress',
  'submitted',
  'timed_out',
  'void'
);

CREATE TYPE question_difficulty AS ENUM (
  'easy',
  'medium',
  'hard',
  'expert'
);

CREATE TYPE wager_status AS ENUM (
  'open',
  'locked',
  'settled',
  'voided'
);

CREATE TYPE coin_ledger_type AS ENUM (
  'credit',
  'debit'
);

CREATE TYPE coin_ledger_reason AS ENUM (
  'arena_wager_placed',
  'arena_wager_won',
  'arena_wager_refund',
  'arena_prize',
  'purchase',
  'daily_reward',
  'admin_adjustment'
);
```

---

### Utility: `updated_at` Trigger Function

```sql
-- Migration: 002_utility_functions.sql

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

> **Note:** No game logic in PostgreSQL. This trigger is purely a timestamp maintenance utility — it belongs here.

---

### Core Tables

#### `questions`

```sql
-- Migration: 003_questions.sql

CREATE TABLE questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category        text NOT NULL,
  difficulty      question_difficulty NOT NULL,
  prompt          text NOT NULL,
  options         jsonb NOT NULL,         -- array of {id, text}
  correct_option  text NOT NULL,          -- matches one options[].id
  explanation     text,
  is_active       boolean NOT NULL DEFAULT true,
  metadata        jsonb,                  -- reserved for tags, source, etc.
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_is_active ON questions(is_active);

CREATE TRIGGER trg_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

**Decision point:** `correct_option` is stored as a plain column (not inside `options` jsonb) so FastAPI can query it directly without jsonb gymnastics. Mobile clients are denied SELECT on this column via a view (see RLS section).

---

#### `arenas`

```sql
-- Migration: 004_arenas.sql

CREATE TABLE arenas (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status              arena_status NOT NULL DEFAULT 'pending',
  max_participants    smallint NOT NULL DEFAULT 2 CHECK (max_participants BETWEEN 2 AND 8),
  max_rounds          smallint NOT NULL DEFAULT 5  CHECK (max_rounds BETWEEN 1 AND 20),
  time_limit_seconds  int NOT NULL DEFAULT 30      CHECK (time_limit_seconds BETWEEN 5 AND 300),
  category            text,                         -- NULL = mixed/random
  difficulty          question_difficulty,           -- NULL = mixed/random
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
```

---

#### `arena_invites`

```sql
-- Migration: 004_arenas.sql (continued)

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
```

---

#### `arena_participants`

```sql
-- Migration: 004_arenas.sql (continued)

CREATE TABLE arena_participants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id        uuid NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status          participant_status NOT NULL DEFAULT 'invited',
  joined_at       timestamptz,
  eliminated_at   timestamptz,
  final_rank      smallint,              -- set by FastAPI at arena completion
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
```

---

#### `arena_rounds`

```sql
-- Migration: 005_arena_rounds.sql

CREATE TABLE arena_rounds (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id        uuid NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  question_id     uuid NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  round_number    smallint NOT NULL CHECK (round_number > 0),
  status          round_status NOT NULL DEFAULT 'pending',
  started_at      timestamptz,
  ends_at         timestamptz,           -- started_at + time_limit_seconds, set by FastAPI
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
```

> **Critical decision:** `question_id` is stored in `arena_rounds`. The mobile client can SELECT `arena_rounds` (to know which round is active and timing), but **must not** see the question's `correct_option`. This is handled by the `questions_safe` view described in the RLS section.

---

#### `arena_attempts`

```sql
-- Migration: 005_arena_rounds.sql (continued)

CREATE TABLE arena_attempts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id        uuid NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  round_id        uuid NOT NULL REFERENCES arena_rounds(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  selected_option text,                  -- NULL if timed out before submission
  is_correct      boolean,               -- set by FastAPI after scoring
  response_ms     int,                   -- client-reported, informational only
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
```

> `response_ms` is stored as-is but FastAPI ignores it for scoring — the authoritative timing comes from server-side timestamps.

---

#### `arena_scores`

```sql
-- Migration: 006_arena_scores.sql

CREATE TABLE arena_scores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id        uuid NOT NULL REFERENCES arenas(id) ON DELETE CASCADE,
  round_id        uuid NOT NULL REFERENCES arena_rounds(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  points_earned   int NOT NULL DEFAULT 0,
  bonus_points    int NOT NULL DEFAULT 0, -- speed bonus, streak bonus, etc.
  total_points    int GENERATED ALWAYS AS (points_earned + bonus_points) STORED,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_arena_scores_round_user UNIQUE (round_id, user_id),
  CONSTRAINT chk_points_non_negative CHECK (points_earned >= 0 AND bonus_points >= 0)
);

CREATE INDEX idx_arena_scores_arena_id ON arena_scores(arena_id);
CREATE INDEX idx_arena_scores_user_id ON arena_scores(user_id);
```

> No `updated_at` on `arena_scores` — scores are immutable once written by FastAPI. If a score must be corrected, FastAPI deletes and reinserts.

---

#### `arena_results`

```sql
-- Migration: 006_arena_scores.sql (continued)

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
```

---

### Adjacent/Existing Systems

#### `profiles`

```sql
-- Referenced only. DO NOT recreate if it already exists.
-- If it does NOT yet exist, create with this definition:

CREATE TABLE IF NOT EXISTS profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        text UNIQUE NOT NULL,
  display_name    text,
  avatar_url      text,
  coin_balance    int NOT NULL DEFAULT 0 CHECK (coin_balance >= 0),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

> **Decision point:** If `profiles` already exists and has a different schema, this migration must be skipped or adapted. See Section F.

---

#### `friends`

```sql
-- Migration: 007_social.sql

CREATE TABLE friends (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_friends_pair UNIQUE (user_id, friend_id),
  CONSTRAINT chk_no_self_friend CHECK (user_id <> friend_id)
);

-- Store friendship in both directions for simple querying
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
```

---

#### `coin_ledger`

```sql
-- Migration: 008_coins.sql

CREATE TABLE coin_ledger (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  type            coin_ledger_type NOT NULL,
  reason          coin_ledger_reason NOT NULL,
  amount          int NOT NULL CHECK (amount > 0),
  balance_after   int NOT NULL CHECK (balance_after >= 0),
  reference_id    uuid,                   -- arena_id, wager_id, etc.
  reference_table text,                   -- 'arenas', 'wagers', etc.
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_coin_ledger_user_id ON coin_ledger(user_id);
CREATE INDEX idx_coin_ledger_reference_id ON coin_ledger(reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX idx_coin_ledger_created_at ON coin_ledger(created_at DESC);
```

> Immutable. No UPDATE/DELETE. `balance_after` is denormalized intentionally — it provides an audit trail without requiring a sum query.

---

#### `wagers`

```sql
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

  CONSTRAINT uq_wagers_arena UNIQUE (arena_id)   -- one wager pool per arena
);

CREATE INDEX idx_wagers_arena_id ON wagers(arena_id);
CREATE INDEX idx_wagers_status ON wagers(status);

CREATE TRIGGER trg_wagers_updated_at
  BEFORE UPDATE ON wagers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

#### `wager_participants`

```sql
-- Migration: 009_wagers.sql (continued)

CREATE TABLE wager_participants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wager_id        uuid NOT NULL REFERENCES wagers(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  coin_amount     int NOT NULL CHECK (coin_amount > 0),
  coins_won       int,                    -- NULL until settled
  joined_at       timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_wager_participants_wager_user UNIQUE (wager_id, user_id)
);

CREATE INDEX idx_wager_participants_wager_id ON wager_participants(wager_id);
CREATE INDEX idx_wager_participants_user_id ON wager_participants(user_id);
```

---

#### `streaks`

```sql
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
```

---

#### `leaderboards`

```sql
-- Migration: 011_leaderboards.sql

CREATE TABLE leaderboards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period          text NOT NULL,          -- 'daily', 'weekly', 'monthly', 'alltime'
  period_key      text NOT NULL,          -- '2026-09', '2026-W37', etc.
  score           int NOT NULL DEFAULT 0,
  rank            int,                    -- computed and set by FastAPI
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
```

---

### The `questions_safe` View

This view exposes questions to mobile clients **without** the `correct_option` column:

```sql
-- Migration: 012_views.sql

CREATE VIEW questions_safe AS
  SELECT
    id,
    category,
    difficulty,
    prompt,
    options,
    explanation,      -- shown AFTER round completes; mobile reads this post-round
    is_active,
    metadata,
    created_at
  FROM questions;
```

> Mobile clients SELECT from `questions_safe`. FastAPI uses the base `questions` table directly via service role (bypasses RLS entirely).

---

## B. RLS Policy Matrix

### Strategy Overview

| Actor | Method | Access |
|---|---|---|
| Mobile (anon) | JWT from Supabase Auth | SELECT only, row-filtered |
| Mobile (authenticated) | JWT from Supabase Auth | SELECT only, row-filtered |
| FastAPI | `service_role` key | Full access, bypasses all RLS |

**The single most important RLS rule:** Enable RLS on every arena table. Grant SELECT to `authenticated` with row-level filtering. Grant **no** INSERT/UPDATE/DELETE to any non-service role.

---

### Enabling RLS

```sql
-- Enable on every competitive table
ALTER TABLE arenas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_invites         ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_participants    ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_rounds          ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_attempts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_scores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_results         ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends               ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_ledger            ENABLE ROW LEVEL SECURITY;
ALTER TABLE wagers                ENABLE ROW LEVEL SECURITY;
ALTER TABLE wager_participants    ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards          ENABLE ROW LEVEL SECURITY;
```

> Views inherit RLS from their underlying tables. `questions_safe` inherits from `questions` — so `questions` must also have RLS enabled and a SELECT policy that reaches through to the view.

---

### Policy Definitions

#### `arenas` — SELECT only for participants

```sql
-- A user can see an arena if they are the host OR a participant
CREATE POLICY "arenas_select_participant" ON arenas
  FOR SELECT TO authenticated
  USING (
    host_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM arena_participants ap
      WHERE ap.arena_id = arenas.id
        AND ap.user_id = auth.uid()
    )
  );

-- NO INSERT / UPDATE / DELETE policies for authenticated role
-- FastAPI uses service_role which bypasses RLS entirely
```

#### `arena_invites` — SELECT only for invitee or host

```sql
CREATE POLICY "arena_invites_select" ON arena_invites
  FOR SELECT TO authenticated
  USING (
    invitee_id = auth.uid()
    OR inviter_id = auth.uid()
  );
```

#### `arena_participants` — SELECT for members of the same arena

```sql
CREATE POLICY "arena_participants_select" ON arena_participants
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM arena_participants self
      WHERE self.arena_id = arena_participants.arena_id
        AND self.user_id = auth.uid()
    )
  );
```

> This lets all participants see each other's participant rows — needed for the lobby UI.

#### `arena_rounds` — SELECT for arena participants

```sql
CREATE POLICY "arena_rounds_select" ON arena_rounds
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM arena_participants ap
      WHERE ap.arena_id = arena_rounds.arena_id
        AND ap.user_id = auth.uid()
    )
  );
```

#### `arena_attempts` — SELECT own attempts only (during round); all after round completes

```sql
-- During active rounds, a user sees only their own attempt
-- After round completes, all participants can see everyone's attempt
CREATE POLICY "arena_attempts_select" ON arena_attempts
  FOR SELECT TO authenticated
  USING (
    -- Always see your own
    user_id = auth.uid()
    OR
    -- See others' only after round is completed
    EXISTS (
      SELECT 1 FROM arena_rounds ar
      WHERE ar.id = arena_attempts.round_id
        AND ar.status = 'completed'
        AND EXISTS (
          SELECT 1 FROM arena_participants ap
          WHERE ap.arena_id = ar.arena_id
            AND ap.user_id = auth.uid()
        )
    )
  );
```

#### `arena_scores` — SELECT for arena participants

```sql
CREATE POLICY "arena_scores_select" ON arena_scores
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM arena_participants ap
      WHERE ap.arena_id = arena_scores.arena_id
        AND ap.user_id = auth.uid()
    )
  );
```

#### `arena_results` — SELECT for arena participants

```sql
CREATE POLICY "arena_results_select" ON arena_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM arena_participants ap
      WHERE ap.arena_id = arena_results.arena_id
        AND ap.user_id = auth.uid()
    )
  );
```

#### `questions` — SELECT is blocked directly; use the view

```sql
-- Deny direct access to questions table (correct_option is here)
-- No SELECT policy for authenticated — table is RLS-enabled with no permissive policies
-- authenticated users must query questions_safe view instead

-- The view itself needs a security definer or we grant SELECT on questions to authenticated
-- with a policy that does NOT expose correct_option. However since SQL views do not
-- column-filter via RLS, the safest approach is:

-- Option A (recommended): Grant SELECT on questions_safe view; deny on questions table.
-- RLS on questions with no permissive policy = zero rows returned for authenticated.
-- The view queries questions as the view owner (security definer context).

-- To make this work, create the view as SECURITY DEFINER:
DROP VIEW IF EXISTS questions_safe;
CREATE VIEW questions_safe
  WITH (security_invoker = false)  -- default; view runs as view owner
AS
  SELECT id, category, difficulty, prompt, options,
         explanation, is_active, metadata, created_at
  FROM questions;

-- Grant SELECT on view to authenticated; NOT on base table
GRANT SELECT ON questions_safe TO authenticated;
-- (No GRANT on questions itself for authenticated)
```

> This is the correct pattern. The view runs with the definer's privileges (postgres/owner), so authenticated users can read from the view even though they have no direct access to `questions`. The `correct_option` column never appears in the view.

#### `profiles` — Own profile always; other profiles if friend or arena-co-participant

```sql
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_select_friend" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM friends f
      WHERE f.user_id = auth.uid()
        AND f.friend_id = profiles.id
    )
  );

CREATE POLICY "profiles_select_arena_participant" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM arena_participants ap1
      JOIN arena_participants ap2 ON ap1.arena_id = ap2.arena_id
      WHERE ap1.user_id = auth.uid()
        AND ap2.user_id = profiles.id
    )
  );

-- Own profile UPDATE only (username, display_name, avatar_url)
-- coin_balance must NOT be user-updatable — FastAPI owns it
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
```

> **Warning:** The `profiles_update_own` policy allows the user to update their own profile row, which includes `coin_balance`. If `coin_balance` is on `profiles`, you must either (a) remove it from `profiles` and query it from `coin_ledger` aggregates, or (b) use a column-level privilege to deny UPDATE on `coin_balance`. See Section F for this decision.

#### `friends` — SELECT own friendships only

```sql
CREATE POLICY "friends_select" ON friends
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());
```

#### `coin_ledger` — SELECT own entries only

```sql
CREATE POLICY "coin_ledger_select" ON coin_ledger
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

#### `wagers` — SELECT if participant in arena

```sql
CREATE POLICY "wagers_select" ON wagers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM arena_participants ap
      WHERE ap.arena_id = wagers.arena_id
        AND ap.user_id = auth.uid()
    )
  );
```

#### `wager_participants` — SELECT own or same-arena participants

```sql
CREATE POLICY "wager_participants_select" ON wager_participants
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM wagers w
      JOIN arena_participants ap ON ap.arena_id = w.arena_id
      WHERE w.id = wager_participants.wager_id
        AND ap.user_id = auth.uid()
    )
  );
```

#### `streaks` — SELECT own only

```sql
CREATE POLICY "streaks_select" ON streaks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

#### `leaderboards` — SELECT all (it's a public leaderboard)

```sql
CREATE POLICY "leaderboards_select" ON leaderboards
  FOR SELECT TO authenticated
  USING (true);
```

---

### RLS Policy Summary Table

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|---|---|---|---|---|
| `arenas` | Host or participant | ❌ | ❌ | ❌ | FastAPI only for writes |
| `arena_invites` | Inviter or invitee | ❌ | ❌ | ❌ | FastAPI only |
| `arena_participants` | Same-arena participant | ❌ | ❌ | ❌ | FastAPI only |
| `arena_rounds` | Arena participant | ❌ | ❌ | ❌ | FastAPI only |
| `arena_attempts` | Own always; others after round completes | ❌ | ❌ | ❌ | FastAPI only |
| `arena_scores` | Arena participant | ❌ | ❌ | ❌ | FastAPI only |
| `arena_results` | Arena participant | ❌ | ❌ | ❌ | FastAPI only |
| `questions` | ❌ (denied) | ❌ | ❌ | ❌ | Use `questions_safe` view |
| `questions_safe` (view) | All authenticated | — | — | — | No `correct_option` |
| `profiles` | Own + friends + co-participants | ❌ | Own row only | ❌ | See coin_balance warning |
| `friends` | Own rows | ❌ | ❌ | ❌ | FastAPI manages |
| `coin_ledger` | Own rows | ❌ | ❌ | ❌ | Append-only via FastAPI |
| `wagers` | Arena participants | ❌ | ❌ | ❌ | FastAPI only |
| `wager_participants` | Own + same-arena | ❌ | ❌ | ❌ | FastAPI only |
| `streaks` | Own row | ❌ | ❌ | ❌ | FastAPI only |
| `leaderboards` | All authenticated | ❌ | ❌ | ❌ | FastAPI only |

---

## C. Migration File/Order Plan

```
supabase/migrations/
  20260101000001_enums.sql
  20260101000002_utility_functions.sql
  20260101000003_questions.sql
  20260101000004_arenas.sql
  20260101000005_arena_rounds.sql
  20260101000006_arena_scores.sql
  20260101000007_social.sql
  20260101000008_coins.sql
  20260101000009_wagers.sql
  20260101000010_streaks.sql
  20260101000011_leaderboards.sql
  20260101000012_views.sql
  20260101000013_rls.sql
  20260101000014_grants.sql
```

### What each migration contains

| File | Contents |
|---|---|
| `000001_enums.sql` | All `CREATE TYPE` statements |
| `000002_utility_functions.sql` | `set_updated_at()` trigger function |
| `000003_questions.sql` | `questions` table + indexes + trigger |
| `000004_arenas.sql` | `arenas`, `arena_invites`, `arena_participants` + indexes + triggers |
| `000005_arena_rounds.sql` | `arena_rounds`, `arena_attempts` + indexes + triggers |
| `000006_arena_scores.sql` | `arena_scores`, `arena_results` + indexes |
| `000007_social.sql` | `profiles` (CREATE IF NOT EXISTS), `friends` |
| `000008_coins.sql` | `coin_ledger` |
| `000009_wagers.sql` | `wagers`, `wager_participants` |
| `000010_streaks.sql` | `streaks` |
| `000011_leaderboards.sql` | `leaderboards` |
| `000012_views.sql` | `questions_safe` view |
| `000013_rls.sql` | All `ALTER TABLE ENABLE ROW LEVEL SECURITY` + all `CREATE POLICY` statements |
| `000014_grants.sql` | `GRANT SELECT ON questions_safe TO authenticated` + any other explicit grants |

### Why this order

- Enums before tables (tables depend on enum types)
- Utility functions before triggers (triggers call the function)
- `questions` before `arena_rounds` (rounds FK to questions)
- `arenas` before rounds/scores/attempts (cascading FKs)
- `profiles` before `friends`/`coin_ledger`/`wagers` (those FK to `auth.users`, but social policies reference profiles)
- RLS last (all tables must exist before policies are created)
- Grants last (view must exist)

---

## D. Supabase CLI Workflow

### Initial Setup

```bash
# Install Supabase CLI (if not already installed)
brew install supabase/tap/supabase   # macOS
# or: npm install -g supabase

# In the project root (where /backend lives)
supabase init
# Creates: supabase/config.toml, supabase/.gitignore

# Link to your remote Supabase project
supabase login
supabase link --project-ref <your-project-ref>
# project-ref is the string in: https://supabase.com/dashboard/project/<project-ref>
```

### Directory Structure After Init

```
project-root/
├── backend/                    # FastAPI (existing)
├── supabase/
│   ├── config.toml             # Supabase project config
│   ├── .gitignore
│   ├── migrations/             # All SQL migration files
│   │   ├── 20260101000001_enums.sql
│   │   ├── ...
│   └── seed.sql                # Development seed data
├── .env.local                  # Local dev env vars (gitignored)
└── README.md
```

### Local Development Workflow

```bash
# Start local Supabase stack (PostgreSQL, Auth, Storage, etc.)
supabase start
# Outputs local URLs and keys — use these in development

# Create a new migration file (use this pattern every time)
supabase migration new <descriptive_name>
# e.g.: supabase migration new add_arena_chat_table
# Creates: supabase/migrations/<timestamp>_add_arena_chat_table.sql

# Apply all pending migrations to LOCAL database
supabase db reset
# Runs: DROP all → apply all migrations in order → run seed.sql
# Use this during active schema development

# OR apply only pending (without resetting):
supabase migration up

# Inspect local DB
supabase db diff                 # show what changed vs last migration
psql postgresql://postgres:postgres@localhost:54322/postgres

# Push migrations to remote (staging/prod)
supabase db push
```

### FastAPI Connection

```bash
# Local development — FastAPI connects to local Supabase
SUPABASE_URL=http://localhost:54321 
SUPABASE_SERVICE_KEY=<service_role_key_from_supabase_start_output> 

# These go in backend/.env (gitignored) 
# FastAPI reads these at startup 
``` 

### Verifying RLS Is Working 

```bash 
# Connect as authenticated user (simulate mobile client) 
# Use Supabase client in test script with anon key + user JWT 

# Connect as service role (simulate FastAPI) 
# Use Supabase client with service_role key 

# Or use psql with SET ROLE: 
psql $LOCAL_DB_URL 
SET request.jwt.claims = '{"sub": "<uuid>", "role": "authenticated"}'; 
SET role authenticated; 
SELECT * FROM arenas;   -- should be filtered 
``` 

--- 

## E. Seed / Development Data Strategy 

### `supabase/seed.sql` 

The seed file runs automatically after `supabase db reset`. It is **development only** and never runs in production. 

```sql 
-- supabase/seed.sql 
-- Development seed: questions + test users + test arena 

-- ============================================================ 
-- 1. QUESTIONS (safe to seed in all environments via a separate 
--    questions migration or admin API call in prod) 
-- ============================================================ 

INSERT INTO questions (id, category, difficulty, prompt, options, correct_option, explanation) 
VALUES 
  ( 
    'a0000000-0000-0000-0000-000000000001', 
    'Science', 
    'easy', 
    'What is the chemical symbol for water?', 
    '[{"id":"A","text":"H2O"},{"id":"B","text":"CO2"},{"id":"C","text":"NaCl"},{"id":"D","text":"O2"}]', 
    'A', 
    'Water is composed of two hydrogen atoms and one oxygen atom.' 
  ), 
  ( 
    'a0000000-0000-0000-0000-000000000002', 
    'History', 
    'medium', 
    'In what year did World War II end?', 
    '[{"id":"A","text":"1943"},{"id":"B","text":"1944"},{"id":"C","text":"1945"},{"id":"D","text":"1946"}]', 
    'C', 
    'World War II ended in 1945 with Germany surrendering in May and Japan in September.' 
  ) 
  -- Add more questions as needed 
; 

-- ============================================================ 
-- 2. TEST USERS 
-- NOTE: auth.users is managed by Supabase Auth. In local dev, 
-- create test users via the Supabase dashboard or Auth API. 
-- Do NOT INSERT into auth.users directly in seed.sql. 
-- The UUIDs below are placeholders — replace with actual 
-- UUIDs created through Auth after supabase start. 
-- ============================================================ 

-- After creating test users via Auth, seed their profiles: 
INSERT INTO profiles (id, username, display_name, coin_balance) 
VALUES 
  ('b0000000-0000-0000-0000-000000000001', 'player_one', 'Player One', 1000), 
  ('b0000000-0000-0000-0000-000000000002', 'player_two', 'Player Two', 500) 
ON CONFLICT (id) DO NOTHING; 

-- ============================================================ 
-- 3. TEST ARENA (FastAPI would normally create these, but for 
--    local DB inspection it's useful to have sample data) 
-- ============================================================ 

INSERT INTO arenas (id, host_user_id, status, max_participants, max_rounds) 
VALUES ( 
  'c0000000-0000-0000-0000-000000000001', 
  'b0000000-0000-0000-0000-000000000001', 
  'pending', 
  2, 
  3 
); 

INSERT INTO arena_participants (arena_id, user_id, status) 
VALUES 
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'active'), 
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'active'); 
``` 

### Questions in Production 

Questions are **content, not schema**. Do not deploy them via migrations. Instead: 

1. **During development:** `seed.sql` (runs on `db reset`) 
2. **Staging/production initial load:** A one-time admin script that calls the Supabase service-role API or a FastAPI admin endpoint 
3. **Ongoing additions:** FastAPI admin endpoint or Supabase Studio — not migrations 
4. `is_active = false` soft-deletes questions without breaking FK references in historical `arena_rounds` 

--- 

## F. Decisions That MUST Be Made Before Implementation 

These are open questions where the wrong default will require a later migration under production data. Resolve them now. 

--- 

### Decision 1: `coin_balance` location 

**Problem:** If `coin_balance` lives on `profiles` and mobile clients can UPDATE their own profile row, they can cheat by writing their own balance. RLS can deny UPDATE on the table, but then legitimate profile fields (username, avatar) can't be updated either. 

**Options:** 
- **A (recommended):** Remove `coin_balance` from `profiles`. Mobile clients compute balance by reading `coin_ledger` (sum of credits minus debits). FastAPI does the same. No user-updatable balance column exists. 
- **B:** Keep `coin_balance` on `profiles` but use column-level privileges: `REVOKE UPDATE (coin_balance) ON profiles FROM authenticated`. Then grant UPDATE on the other columns explicitly. This works but is unusual in Supabase and harder to maintain. 
- **C:** Keep `coin_balance` on `profiles`, allow profile UPDATE policy, and accept the risk — mitigated by FastAPI validating all coin operations server-side. Weakest option. 

**Recommended:** Option A. The ledger is the source of truth; the balance is a derived value. FastAPI can cache it or expose it via a dedicated endpoint. 

--- 

### Decision 2: Does `profiles` already exist? 

**Problem:** Supabase projects often have a `profiles` table created via the Auth trigger at project setup. Its schema may differ from what's defined above. 

**Required action before implementation:** 
- Run `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'` against the linked project 
- If it exists and has a compatible schema, migration `000007_social.sql` must use `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ADD COLUMN IF NOT EXISTS` for any missing columns 
- If it has an incompatible schema, decide which columns to add vs. which to keep from the existing definition 

--- 

### Decision 3: `friends` table — bidirectional or one-directional? 

**Problem:** Friendships are typically mutual. The schema above stores bidirectional rows (both `(A,B)` and `(B,A)`). This simplifies queries but requires FastAPI to always write two rows. 

**Alternative:** Store one row per relationship, query with `WHERE user_id = X OR friend_id = X`. Simpler to write, more complex to query. 

**Recommended:** Bidirectional (two rows). FastAPI inserts both in a transaction. RLS `WHERE user_id = auth.uid()` remains simple. 

--- 

### Decision 4: `arena_attempts` — who creates the initial row? 

**Problem:** When a round starts, a mobile client needs an attempt row to submit against. But mobile clients cannot INSERT. 

**Two patterns:** 
- **A (recommended):** FastAPI creates all `arena_attempts` rows (with `status = 'in_progress'`) when a round starts, for all participants. Mobile client then receives them via SELECT and submits their answer via FastAPI HTTP endpoint — FastAPI UPDATEs the row. 
- **B:** Mobile client sends answer to FastAPI endpoint; FastAPI does one INSERT for the attempt. Simpler, but the mobile client doesn't have a row to subscribe to via Supabase Realtime until FastAPI creates it. 

**Recommended:** Option A. Pre-create attempt rows at round start. Mobile subscribes to their attempt row via Realtime. FastAPI updates it on submission. This also makes it trivial to detect timeouts (un-updated `in_progress` rows after `ends_at`). 

--- 

### Decision 5: Realtime subscription scope 

**Problem:** Supabase Realtime uses RLS for filtering. If Realtime is enabled on `arena_attempts` and the mobile client subscribes, they will only receive updates for rows that pass their RLS policy. This is correct behavior, but must be tested explicitly. 

**Required:** After migrations are applied, test Realtime subscriptions against the local stack with a real JWT to confirm RLS-filtered Realtime works as expected before FastAPI is implemented. Realtime must be explicitly enabled per-table in Supabase config or via the dashboard. 

--- 

### Decision 6: Service role key in FastAPI 

**The service role key bypasses all RLS.** This is the intended pattern — FastAPI is the authoritative writer. But it means: 

- The key must **never** be exposed to mobile clients 
- The key must be stored as a secret (environment variable, not in code) 
- FastAPI must validate all business rules before writing — the DB will not enforce game logic 
- Consider IP allowlisting the service role key in Supabase's API settings if available 

--- 

### Decision 7: Enum extensibility 

PostgreSQL enums are hard to modify after creation (adding a value requires `ALTER TYPE ... ADD VALUE` which cannot be done inside a transaction in PostgreSQL < 12). Supabase uses PostgreSQL 15, so `ADD VALUE` works but the enum value cannot be removed or reordered without recreating the type. 

**Decision required:** Review all enum values now and confirm they are exhaustive. For frequently-changing categorizations (e.g., `coin_ledger_reason`), consider using `text` + a `CHECK` constraint instead of a native enum — easier to extend. 

**Recommendation:** Keep enums for status fields (they're stable). Use `text` + CHECK for `coin_ledger_reason` and `question_difficulty` to allow easy extension. 

--- 

### Decision 8: Leaderboard update strategy 

`leaderboards` rows are updated by FastAPI after each arena completes. With many concurrent arenas, this can cause row contention. The schema uses `ON CONFLICT DO UPDATE` (upsert). Confirm with the team whether leaderboards are updated in real-time (after each arena) or in batch (scheduled job). This affects FastAPI implementation but not the schema. 

--- 

### Summary Checklist Before Coding 

- [ ] Confirm `coin_balance` placement (profiles vs. ledger-only) 
- [ ] Inspect existing `profiles` table schema in linked Supabase project 
- [ ] Confirm bidirectional friendship storage 
- [ ] Confirm attempt pre-creation pattern (FastAPI creates on round start) 
- [ ] Test Realtime + RLS locally before FastAPI integration 
- [ ] Store service role key as environment variable only; never in mobile app 
- [ ] Review all enum values for completeness 
- [ ] Decide leaderboard update strategy (real-time vs. batch) 
- [ ] Run `supabase link` and `supabase db push --dry-run` to validate migration syntax before first push