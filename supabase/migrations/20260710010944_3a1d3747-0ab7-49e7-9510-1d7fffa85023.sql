
CREATE POLICY "Public read site-assets" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'site-assets');
CREATE POLICY "Admins write site-assets insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write site-assets update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write site-assets delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));
