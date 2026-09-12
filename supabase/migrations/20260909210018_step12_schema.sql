-- Migration: 018_step12_schema.sql

-- Add timezone and global_opt_in to profiles
ALTER TABLE profiles ADD COLUMN timezone TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE profiles ADD COLUMN global_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

-- Add free_recovery_available to streaks
ALTER TABLE streaks ADD COLUMN free_recovery_available BOOLEAN NOT NULL DEFAULT TRUE;
