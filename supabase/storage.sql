-- Supabase Storage buckets for Wandr

INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-covers', 'trip-covers', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('travel-docs', 'travel-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Trip covers: public read, authenticated upload to own folder
CREATE POLICY "Trip covers public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'trip-covers');

CREATE POLICY "Trip covers authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'trip-covers'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Trip covers owner update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'trip-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Trip covers owner delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'trip-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Travel docs: private per user folder
CREATE POLICY "Travel docs owner read"
ON storage.objects FOR SELECT
USING (bucket_id = 'travel-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Travel docs owner insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'travel-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Travel docs owner update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'travel-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Travel docs owner delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'travel-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
