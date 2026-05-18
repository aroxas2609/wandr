-- Wandr RLS policies — run after schema.sql in Supabase SQL Editor

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper: user can access trip if owner or member
CREATE OR REPLACE FUNCTION public.can_access_trip(trip_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM trips t
    WHERE t.id = trip_uuid
      AND (
        t.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid()
        )
      )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Users
CREATE POLICY "Users read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

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

CREATE POLICY "Users update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Trips
CREATE POLICY "Trip owners full access" ON trips
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Trip members can view" ON trips
  FOR SELECT USING (public.can_access_trip(id));

-- Itinerary days
CREATE POLICY "Days access via trip" ON itinerary_days
  FOR ALL USING (public.can_access_trip(trip_id));

-- Activities
CREATE POLICY "Activities access via day" ON activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM itinerary_days d
      WHERE d.id = activities.day_id
        AND public.can_access_trip(d.trip_id)
    )
  );

-- Trip members
CREATE POLICY "Members viewable by trip access" ON trip_members
  FOR SELECT USING (public.can_access_trip(trip_id));

CREATE POLICY "Owners manage members" ON trip_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_members.trip_id AND t.owner_id = auth.uid())
  );

-- Expenses
CREATE POLICY "Expenses via trip access" ON expenses
  FOR ALL USING (public.can_access_trip(trip_id));

-- Packing
CREATE POLICY "Packing via trip access" ON packing_items
  FOR ALL USING (public.can_access_trip(trip_id));

-- Travel documents
CREATE POLICY "Documents owner or trip access" ON travel_documents
  FOR ALL USING (
    auth.uid() = user_id
    OR (trip_id IS NOT NULL AND public.can_access_trip(trip_id))
  );

-- Notifications
CREATE POLICY "Notifications own user" ON notifications
  FOR ALL USING (auth.uid() = user_id);
