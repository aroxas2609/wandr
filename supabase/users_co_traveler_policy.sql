-- Let trip owners and members read each other's name/email for the Travelers list.
-- Without this, PostgREST joins on users(...) return null for other members (RLS blocks SELECT).

DROP POLICY IF EXISTS "Users readable by trip co-travelers" ON users;

CREATE POLICY "Users readable by trip co-travelers" ON users
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1
      FROM trip_members tm_viewer
      JOIN trip_members tm_other ON tm_other.trip_id = tm_viewer.trip_id
      WHERE tm_viewer.user_id = auth.uid()
        AND tm_other.user_id = users.id
    )
    OR EXISTS (
      SELECT 1
      FROM trips t
      WHERE t.owner_id = users.id
        AND public.can_access_trip(t.id)
    )
    OR EXISTS (
      SELECT 1
      FROM trips t
      JOIN trip_members tm ON tm.trip_id = t.id
      WHERE t.owner_id = auth.uid()
        AND tm.user_id = users.id
    )
  );
