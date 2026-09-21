-- Migration: 020_revenuecat_observability.sql

ALTER TABLE revenuecat_events 
  ADD COLUMN event_type text,
  ADD COLUMN app_user_id text,
  ADD COLUMN environment text,
  ADD COLUMN product_id text,
  ADD COLUMN processing_result text;

-- (processed_at already exists in the table as per 019_subscriptions.sql)
