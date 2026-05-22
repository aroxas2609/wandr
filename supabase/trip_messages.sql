-- Trip-wide chat (run after policies.sql + role_policies.sql)

CREATE TABLE IF NOT EXISTS trip_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (
    char_length(trim(body)) > 0 AND char_length(body) <= 2000
  ),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_trip_messages_trip_created
  ON trip_messages(trip_id, created_at DESC);

ALTER TABLE trip_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trip messages read via trip access" ON trip_messages
  FOR SELECT USING (public.can_access_trip(trip_id));

CREATE POLICY "Trip messages insert by members" ON trip_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.can_access_trip(trip_id)
  );

CREATE POLICY "Trip messages update own" ON trip_messages
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND char_length(trim(body)) > 0
    AND char_length(body) <= 2000
  );

CREATE POLICY "Trip messages delete own or owner" ON trip_messages
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM trips t
      WHERE t.id = trip_messages.trip_id AND t.owner_id = auth.uid()
    )
  );
