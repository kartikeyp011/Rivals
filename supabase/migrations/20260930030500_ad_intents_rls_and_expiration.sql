-- Enable RLS on the ad tracking tables to prevent mobile clients from bypassing FastAPI
ALTER TABLE ad_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE admob_ssv_events ENABLE ROW LEVEL SECURITY;

-- No policies are created for anon or authenticated roles.
-- This intentionally blocks all direct Supabase Client access to these tables.
-- The FastAPI backend uses a privileged connection which bypasses RLS,
-- preserving the intended trust boundary: Mobile -> FastAPI -> Database.

-- Add expires_at to ad_intents for intent expiration (Fix 2)
ALTER TABLE ad_intents ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
UPDATE ad_intents SET expires_at = created_at + interval '30 minutes' WHERE expires_at IS NULL;
ALTER TABLE ad_intents ALTER COLUMN expires_at SET NOT NULL;
