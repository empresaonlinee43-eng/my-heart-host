CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

GRANT USAGE ON SCHEMA private TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated, anon, public;

DROP POLICY IF EXISTS "Admins write apps" ON public.apps;
CREATE POLICY "Admins write apps"
ON public.apps
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins write settings" ON public.site_settings;
CREATE POLICY "Admins write settings"
ON public.site_settings
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage all app projects" ON public.app_projects;
CREATE POLICY "Admins can manage all app projects"
ON public.app_projects
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins write site-assets delete" ON storage.objects;
DROP POLICY IF EXISTS "Admins write site-assets insert" ON storage.objects;
DROP POLICY IF EXISTS "Admins write site-assets update" ON storage.objects;

CREATE POLICY "Admins write site-assets insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-assets' AND private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins write site-assets update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'site-assets' AND private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'site-assets' AND private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins write site-assets delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'site-assets' AND private.has_role(auth.uid(), 'admin'::public.app_role));