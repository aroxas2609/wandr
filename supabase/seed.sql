-- Wandr Seed Data (optional reference for manual SQL seeding)
-- Apply after schema.sql with a real auth user UUID substituted for OWNER_ID

-- INSERT INTO users (id, email, full_name) VALUES
--   ('OWNER_ID', 'demo@wandr.app', 'Alex Morgan');

-- INSERT INTO trips (id, owner_id, title, destination, cover_url, start_date, end_date, budget_target, travel_styles, status) VALUES
--   ('trip-paris-001', 'OWNER_ID', 'Paris Honeymoon', 'Paris, France',
--    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
--    '2026-06-15', '2026-06-22', 8500, ARRAY['Romantic','Luxury','Foodie'], 'upcoming'),
--   ('trip-tokyo-002', 'OWNER_ID', 'Tokyo Family Adventure', 'Tokyo, Japan',
--    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
--    '2026-03-20', '2026-03-28', 12000, ARRAY['Family','Culture','Foodie'], 'upcoming');
