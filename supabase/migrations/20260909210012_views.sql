-- Migration: 012_views.sql

DROP VIEW IF EXISTS questions_safe;
CREATE VIEW questions_safe
  WITH (security_invoker = false)
AS
  SELECT id, category, difficulty, prompt, options,
         explanation, is_active, metadata, created_at
  FROM questions;
