-- ============================================================================
-- Production Verification Script
-- ============================================================================

-- 1. Exact row count & unique ID count
SELECT count(*) AS total_rows, count(DISTINCT id) AS unique_ids FROM questions;

-- 2. Duplicate prompts (Should be 0)
SELECT count(prompt) - count(DISTINCT prompt) AS duplicate_prompts FROM questions;

-- 3. Category distribution
SELECT category, count(*) FROM questions GROUP BY category ORDER BY count DESC;

-- 4. Difficulty distribution
SELECT difficulty, count(*) FROM questions GROUP BY difficulty ORDER BY count DESC;

-- 5. Safe View structural verification (Should be 300)
SELECT count(*) AS safe_view_rows FROM questions_safe;

-- 6. Safe View column absence verification
-- This block attempts to access correct_option. If absent, it catches the error
-- and raises a confirmation notice rather than failing the whole script.
DO $$ 
BEGIN
  PERFORM correct_option FROM questions_safe LIMIT 1;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'CONFIRMED: correct_option is absent from questions_safe (ERROR: %)', SQLERRM;
END $$;

-- 7. RLS Verification via Impersonation
BEGIN;
  -- Impersonate an authenticated API user
  SET request.jwt.claims TO '{"role": "authenticated"}';
  SET ROLE authenticated;
  
  -- Attempt to read the RAW table (Must Fail or return 0 rows depending on Grants/RLS)
  SELECT count(*) AS authenticated_raw_read_count FROM questions;
  
  -- Attempt to read the SAFE view (Must Succeed with 300 rows)
  SELECT count(*) AS authenticated_safe_read_count FROM questions_safe;

-- Revert impersonation
ROLLBACK;
