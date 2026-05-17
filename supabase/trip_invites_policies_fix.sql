-- If pending invites fail with permission/RLS errors, run this after trip_invites.sql

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
