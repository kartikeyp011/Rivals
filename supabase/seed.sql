-- supabase/seed.sql
-- Development seed: questions + test users + test arena

-- ============================================================
-- 1. QUESTIONS
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
;

-- ============================================================
-- 2. TEST USERS
-- NOTE: auth.users is managed by Supabase Auth. In local dev,
-- create test users via the Supabase dashboard or Auth API.
-- Do NOT INSERT into auth.users directly in seed.sql.
-- ============================================================

-- After creating test users via Auth, seed their profiles:
INSERT INTO profiles (id, username, display_name)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'player_one', 'Player One'),
  ('b0000000-0000-0000-0000-000000000002', 'player_two', 'Player Two')
ON CONFLICT (id) DO NOTHING;

-- Initial coin balances (via coin_ledger instead of profiles, per Option A)
INSERT INTO coin_ledger (id, user_id, type, reason, amount, balance_after, metadata)
VALUES
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'credit', 'admin_adjustment', 1000, 1000, '{"note": "Initial seed"}'),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'credit', 'admin_adjustment', 500, 500, '{"note": "Initial seed"}')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. TEST ARENA
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
