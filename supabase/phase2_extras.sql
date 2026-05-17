-- Phase 2 schema additions — run after schema.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS trip_updates BOOLEAN DEFAULT TRUE;

ALTER TABLE trip_members
  ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_trip_members_invite ON trip_members(invite_token)
  WHERE invite_token IS NOT NULL;
