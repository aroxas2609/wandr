-- Editor vs viewer: run after policies.sql and expenses_policies_fix.sql

CREATE OR REPLACE FUNCTION public.can_edit_trip(trip_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM trips t
    WHERE t.id = trip_uuid AND t.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM trip_members tm
    WHERE tm.trip_id = trip_uuid
      AND tm.user_id = auth.uid()
      AND tm.role = 'editor'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Itinerary days
DROP POLICY IF EXISTS "Days access via trip" ON itinerary_days;

CREATE POLICY "Days read via trip" ON itinerary_days
  FOR SELECT USING (public.can_access_trip(trip_id));

CREATE POLICY "Days mutate editors" ON itinerary_days
  FOR INSERT WITH CHECK (public.can_edit_trip(trip_id));

CREATE POLICY "Days update editors" ON itinerary_days
  FOR UPDATE USING (public.can_edit_trip(trip_id));

CREATE POLICY "Days delete editors" ON itinerary_days
  FOR DELETE USING (public.can_edit_trip(trip_id));

-- Activities
DROP POLICY IF EXISTS "Activities access via day" ON activities;

CREATE POLICY "Activities read via day" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM itinerary_days d
      WHERE d.id = activities.day_id
        AND public.can_access_trip(d.trip_id)
    )
  );

CREATE POLICY "Activities insert editors" ON activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM itinerary_days d
      WHERE d.id = activities.day_id
        AND public.can_edit_trip(d.trip_id)
    )
  );

CREATE POLICY "Activities update editors" ON activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM itinerary_days d
      WHERE d.id = activities.day_id
        AND public.can_edit_trip(d.trip_id)
    )
  );

CREATE POLICY "Activities delete editors" ON activities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM itinerary_days d
      WHERE d.id = activities.day_id
        AND public.can_edit_trip(d.trip_id)
    )
  );

-- Packing
DROP POLICY IF EXISTS "Packing via trip access" ON packing_items;

CREATE POLICY "Packing read via trip" ON packing_items
  FOR SELECT USING (public.can_access_trip(trip_id));

CREATE POLICY "Packing insert editors" ON packing_items
  FOR INSERT WITH CHECK (public.can_edit_trip(trip_id));

CREATE POLICY "Packing update editors" ON packing_items
  FOR UPDATE USING (public.can_edit_trip(trip_id));

CREATE POLICY "Packing delete editors" ON packing_items
  FOR DELETE USING (public.can_edit_trip(trip_id));

-- Expenses (replace expenses_policies_fix policies)
DROP POLICY IF EXISTS "Expenses read" ON expenses;
DROP POLICY IF EXISTS "Expenses insert" ON expenses;
DROP POLICY IF EXISTS "Expenses update" ON expenses;
DROP POLICY IF EXISTS "Expenses delete" ON expenses;
DROP POLICY IF EXISTS "Expenses via trip access" ON expenses;

CREATE POLICY "Expenses read via trip" ON expenses
  FOR SELECT USING (public.can_access_trip(trip_id));

CREATE POLICY "Expenses insert editors" ON expenses
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.can_edit_trip(trip_id)
  );

CREATE POLICY "Expenses update editors" ON expenses
  FOR UPDATE USING (public.can_edit_trip(trip_id))
  WITH CHECK (public.can_edit_trip(trip_id));

CREATE POLICY "Expenses delete editors" ON expenses
  FOR DELETE USING (public.can_edit_trip(trip_id));
