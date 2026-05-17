-- Run if wallet saves fail with RLS errors (after policies.sql + storage.sql)

DROP POLICY IF EXISTS "Documents owner or trip access" ON travel_documents;

CREATE POLICY "Travel documents read" ON travel_documents
  FOR SELECT USING (
    auth.uid() = user_id
    OR (trip_id IS NOT NULL AND public.can_access_trip(trip_id))
  );

CREATE POLICY "Travel documents insert" ON travel_documents
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (trip_id IS NULL OR public.can_access_trip(trip_id))
  );

CREATE POLICY "Travel documents update" ON travel_documents
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Travel documents delete" ON travel_documents
  FOR DELETE USING (auth.uid() = user_id);
