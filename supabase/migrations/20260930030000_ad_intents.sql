-- Migration for AdMob SSV tracking and rewarded ad intents

CREATE TYPE ad_action AS ENUM ('create_arena', 'create_wager', 'claim_reward');
CREATE TYPE ad_intent_status AS ENUM ('pending', 'completed', 'used', 'failed');

CREATE TABLE ad_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action ad_action NOT NULL,
    status ad_intent_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE,
    error_reason TEXT
);

-- Index for quick lookups by user and status
CREATE INDEX idx_ad_intents_user_status ON ad_intents(user_id, status);

-- Table to store AdMob SSV events for idempotency and audit
CREATE TABLE admob_ssv_events (
    event_id TEXT PRIMARY KEY,
    intent_id UUID REFERENCES ad_intents(id) ON DELETE CASCADE,
    reward_amount INT,
    reward_item TEXT,
    key_id TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update coin_ledger_reason enum with rewarded_ad
ALTER TYPE coin_ledger_reason ADD VALUE IF NOT EXISTS 'rewarded_ad';
