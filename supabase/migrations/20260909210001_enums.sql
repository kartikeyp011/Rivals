-- Migration: 001_enums.sql

CREATE TYPE arena_status AS ENUM (
  'pending',
  'active',
  'completed',
  'cancelled'
);

CREATE TYPE invite_status AS ENUM (
  'pending',
  'accepted',
  'declined',
  'expired'
);

CREATE TYPE participant_status AS ENUM (
  'invited',
  'active',
  'eliminated',
  'withdrawn',
  'completed'
);

CREATE TYPE round_status AS ENUM (
  'pending',
  'active',
  'scoring',
  'completed'
);

CREATE TYPE attempt_status AS ENUM (
  'in_progress',
  'submitted',
  'timed_out',
  'void'
);

CREATE TYPE question_difficulty AS ENUM (
  'easy',
  'medium',
  'hard',
  'expert'
);

CREATE TYPE wager_status AS ENUM (
  'open',
  'locked',
  'settled',
  'voided'
);

CREATE TYPE coin_ledger_type AS ENUM (
  'credit',
  'debit'
);

CREATE TYPE coin_ledger_reason AS ENUM (
  'arena_wager_placed',
  'arena_wager_won',
  'arena_wager_refund',
  'arena_prize',
  'purchase',
  'daily_reward',
  'admin_adjustment'
);
