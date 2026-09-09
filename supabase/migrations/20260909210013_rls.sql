-- Migration: 013_rls.sql

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

-- arenas
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

-- arena_invites
CREATE POLICY "arena_invites_select" ON arena_invites
  FOR SELECT TO authenticated
  USING (
    invitee_id = auth.uid()
    OR inviter_id = auth.uid()
  );

-- arena_participants
CREATE POLICY "arena_participants_select" ON arena_participants
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM arena_participants self
      WHERE self.arena_id = arena_participants.arena_id
        AND self.user_id = auth.uid()
    )
  );

-- arena_rounds
CREATE POLICY "arena_rounds_select" ON arena_rounds
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM arena_participants ap
      WHERE ap.arena_id = arena_rounds.arena_id
        AND ap.user_id = auth.uid()
    )
  );

-- arena_attempts
CREATE POLICY "arena_attempts_select" ON arena_attempts
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR
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

-- arena_scores
CREATE POLICY "arena_scores_select" ON arena_scores
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM arena_participants ap
      WHERE ap.arena_id = arena_scores.arena_id
        AND ap.user_id = auth.uid()
    )
  );

-- arena_results
CREATE POLICY "arena_results_select" ON arena_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM arena_participants ap
      WHERE ap.arena_id = arena_results.arena_id
        AND ap.user_id = auth.uid()
    )
  );

-- profiles
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

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- friends
CREATE POLICY "friends_select" ON friends
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- coin_ledger
CREATE POLICY "coin_ledger_select" ON coin_ledger
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- wagers
CREATE POLICY "wagers_select" ON wagers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM arena_participants ap
      WHERE ap.arena_id = wagers.arena_id
        AND ap.user_id = auth.uid()
    )
  );

-- wager_participants
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

-- streaks
CREATE POLICY "streaks_select" ON streaks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- leaderboards
CREATE POLICY "leaderboards_select" ON leaderboards
  FOR SELECT TO authenticated
  USING (true);
