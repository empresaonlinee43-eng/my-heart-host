CREATE TABLE public.app_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT 'Meu app',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_projects_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]{2,62}$')
);

GRANT SELECT ON public.app_projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_projects TO authenticated;
GRANT ALL ON public.app_projects TO service_role;

ALTER TABLE public.app_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published app projects"
ON public.app_projects
FOR SELECT
TO anon, authenticated
USING (is_public = true);

CREATE POLICY "Users can read own app projects"
ON public.app_projects
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own app projects"
ON public.app_projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own app projects"
ON public.app_projects
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own app projects"
ON public.app_projects
FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all app projects"
ON public.app_projects
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_app_projects_updated_at
BEFORE UPDATE ON public.app_projects
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();