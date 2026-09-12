-- Migration: 017_friends_status.sql

CREATE TYPE friend_status AS ENUM ('pending', 'accepted', 'rejected');
ALTER TABLE friends ADD COLUMN status friend_status NOT NULL DEFAULT 'pending';
CREATE INDEX idx_friends_status ON friends(status);

ALTER PUBLICATION supabase_realtime ADD TABLE friends;
ALTER PUBLICATION supabase_realtime ADD TABLE arena_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE arena_invites;
