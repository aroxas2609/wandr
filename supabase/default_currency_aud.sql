-- Optional: default new expenses to AUD (run once if you want DB default to match the app)
ALTER TABLE expenses ALTER COLUMN currency SET DEFAULT 'AUD';
