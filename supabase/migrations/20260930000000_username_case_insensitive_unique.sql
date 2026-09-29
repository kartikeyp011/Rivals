-- Migration: usernames may contain capital letters, but must stay unique regardless of case
-- ("Om" and "om" cannot both exist). The existing UNIQUE(username) is case-sensitive.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key ON profiles (lower(username));
