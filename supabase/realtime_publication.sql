-- Enable Supabase Realtime for shared trip collaboration.
-- Run once in Supabase SQL Editor (after schema.sql and policies.sql).
-- Verify under Database → Replication that these tables are listed.

ALTER PUBLICATION supabase_realtime ADD TABLE trips;
ALTER PUBLICATION supabase_realtime ADD TABLE itinerary_days;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_members;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE packing_items;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_messages;
