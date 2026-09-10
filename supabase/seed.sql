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

-- Since we cannot insert into auth.users, and profiles/arenas depend on it,
-- we must create test users via API AFTER the stack starts, and insert their profiles then.
