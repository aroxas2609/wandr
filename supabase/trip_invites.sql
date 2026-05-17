-- Pending trip invites (run after schema.sql + policies.sql)
-- For friends who do not have a Wandr account yet.

CREATE TABLE IF NOT EXISTS trip_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('editor', 'viewer')),
  invite_token TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (trip_id, email)
);

CREATE INDEX IF NOT EXISTS idx_trip_invites_trip ON trip_invites(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_invites_token ON trip_invites(invite_token);

ALTER TABLE trip_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trip invites via trip access" ON trip_invites;

CREATE POLICY "Trip invites read" ON trip_invites
  FOR SELECT USING (public.can_access_trip(trip_id));

CREATE POLICY "Trip invites insert" ON trip_invites
  FOR INSERT WITH CHECK (
    public.can_access_trip(trip_id)
    AND invited_by = auth.uid()
  );

CREATE POLICY "Trip invites update" ON trip_invites
  FOR UPDATE USING (public.can_access_trip(trip_id))
  WITH CHECK (public.can_access_trip(trip_id));

CREATE POLICY "Trip invites delete" ON trip_invites
  FOR DELETE USING (public.can_access_trip(trip_id));
