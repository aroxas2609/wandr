-- Run if adding expenses fails with RLS errors (after policies.sql)

DROP POLICY IF EXISTS "Expenses via trip access" ON expenses;

CREATE POLICY "Expenses read" ON expenses
  FOR SELECT USING (public.can_access_trip(trip_id));

CREATE POLICY "Expenses insert" ON expenses
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.can_access_trip(trip_id)
  );

CREATE POLICY "Expenses update" ON expenses
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.can_access_trip(trip_id));

CREATE POLICY "Expenses delete" ON expenses
  FOR DELETE USING (auth.uid() = user_id);
