-- Allow archiving trips (run once)

ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;

ALTER TABLE trips ADD CONSTRAINT trips_status_check
  CHECK (status IN ('upcoming', 'active', 'past', 'draft', 'archived'));
