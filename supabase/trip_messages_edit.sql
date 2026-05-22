-- Message edit support (run after trip_messages.sql if table already exists)

ALTER TABLE trip_messages
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

DROP POLICY IF EXISTS "Trip messages update own" ON trip_messages;

CREATE POLICY "Trip messages update own" ON trip_messages
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND char_length(trim(body)) > 0
    AND char_length(body) <= 2000
  );
