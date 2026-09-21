-- Migration: 019_subscriptions.sql

CREATE TYPE subscription_status AS ENUM (
  'active',
  'canceled',
  'past_due',
  'unpaid',
  'expired'
);

CREATE TYPE subscription_environment AS ENUM (
  'sandbox',
  'production'
);

CREATE TABLE subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider                text NOT NULL DEFAULT 'revenuecat',
  product_id              text NOT NULL,
  entitlement_id          text,
  status                  subscription_status NOT NULL,
  environment             subscription_environment NOT NULL,
  original_purchase_at    timestamptz,
  purchased_at            timestamptz,
  expires_at              timestamptz,
  will_renew              boolean NOT NULL DEFAULT false,
  store_transaction_id    text,
  revenuecat_app_user_id  text NOT NULL,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_subscriptions_user_entitlement UNIQUE (user_id, entitlement_id)
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
-- Only allow service role to modify subscriptions. Users can only read their own.
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Webhook Idempotency Table
CREATE TABLE revenuecat_events (
  event_id      text PRIMARY KEY,
  processed_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE revenuecat_events ENABLE ROW LEVEL SECURITY;
