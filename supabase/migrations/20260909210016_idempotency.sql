-- Migration: 016_idempotency.sql

CREATE TABLE idempotency_keys (
  idempotency_key text PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_path    text NOT NULL,
  request_body    jsonb,
  response_status int,
  response_body   jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL
);

CREATE INDEX idx_idempotency_keys_user_id ON idempotency_keys(user_id);
CREATE INDEX idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);

-- Set up RLS to deny access (FastAPI uses service role)
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
