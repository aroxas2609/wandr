-- Let editors invite and add members (run after role_policies.sql + trip_invites.sql)
-- Replaces owner-only trip_members mutations and tightens trip_invites writes to editors+owner.

DROP POLICY IF EXISTS "Owners manage members" ON trip_members;

CREATE POLICY "Members insert editors" ON trip_members
  FOR INSERT WITH CHECK (
    public.can_edit_trip(trip_id)
    AND (
      trip_members.role IN ('editor', 'viewer')
      OR EXISTS (
        SELECT 1 FROM trips t
        WHERE t.id = trip_members.trip_id AND t.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Members update owner" ON trip_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM trips t
      WHERE t.id = trip_members.trip_id AND t.owner_id = auth.uid()
    )
  );

CREATE POLICY "Members delete owner" ON trip_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trips t
      WHERE t.id = trip_members.trip_id AND t.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Trip invites insert" ON trip_invites;
DROP POLICY IF EXISTS "Trip invites update" ON trip_invites;
DROP POLICY IF EXISTS "Trip invites delete" ON trip_invites;

CREATE POLICY "Trip invites insert" ON trip_invites
  FOR INSERT WITH CHECK (
    public.can_edit_trip(trip_id)
    AND invited_by = auth.uid()
  );

CREATE POLICY "Trip invites update" ON trip_invites
  FOR UPDATE USING (public.can_edit_trip(trip_id))
  WITH CHECK (public.can_edit_trip(trip_id));

CREATE POLICY "Trip invites delete" ON trip_invites
  FOR DELETE USING (public.can_edit_trip(trip_id));
