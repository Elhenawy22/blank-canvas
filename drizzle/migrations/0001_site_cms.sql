CREATE TABLE public.site_settings (id int PRIMARY KEY DEFAULT 1 CHECK (id = 1), data jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin insert" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.site_settings (id) VALUES (1);

CREATE TABLE public.cms_projects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, category text NOT NULL DEFAULT 'branding', image text NOT NULL, link text, description text, sort int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.cms_projects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cms_projects TO authenticated;
GRANT ALL ON public.cms_projects TO service_role;
ALTER TABLE public.cms_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON public.cms_projects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin write" ON public.cms_projects FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "media admin upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "media admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));