-- Migration: 015_realtime.sql
-- Enable arena_attempts for Supabase Realtime broadcasts.
-- RLS policies (013_rls.sql) still apply to filter what each subscriber receives.
ALTER PUBLICATION supabase_realtime ADD TABLE arena_attempts;
