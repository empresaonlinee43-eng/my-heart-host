DROP POLICY IF EXISTS "Public read site-assets" ON storage.objects;

CREATE POLICY "Users manage own site-assets select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'site-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users manage own site-assets insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'site-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users manage own site-assets update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'site-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'site-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users manage own site-assets delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'site-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);