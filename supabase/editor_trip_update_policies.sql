-- Let editors update trip details (run after role_policies.sql)
-- Owners keep full access via "Trip owners full access"; this adds UPDATE for editors.

DROP POLICY IF EXISTS "Trips update editors" ON trips;

CREATE POLICY "Trips update editors" ON trips
  FOR UPDATE
  USING (public.can_edit_trip(id))
  WITH CHECK (public.can_edit_trip(id));
