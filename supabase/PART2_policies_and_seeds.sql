-- ============================================================
-- Run this SECOND (after PART1_add_enum.sql completes)
-- ============================================================
DROP POLICY IF EXISTS "Clients see own orders" ON public.orders;
CREATE POLICY "Clients see own orders" ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'parttimer'));

DROP POLICY IF EXISTS "View order files" ON public.order_files;
CREATE POLICY "View order files" ON public.order_files FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'parttimer') OR
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
CREATE POLICY "Users can view profiles" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'parttimer'));

DROP POLICY IF EXISTS "Users view own input files" ON storage.objects;
CREATE POLICY "Users view own input files" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'input-files' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'parttimer')
    )
  );

DROP POLICY IF EXISTS "View output files" ON storage.objects;
CREATE POLICY "View output files" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'output-files' AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'parttimer') OR
      auth.uid()::text = (storage.foldername(name))[1]
    )
  );

INSERT INTO public.user_roles (user_id, role, name)
SELECT u.id, 'admin'::public.app_role, COALESCE(p.full_name, u.email)
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.email = 'admin@example.com'
ON CONFLICT (user_id, role) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.user_roles (user_id, role, name)
SELECT u.id, 'parttimer'::public.app_role, COALESCE(p.full_name, u.email)
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.email = 'parttimer@example.com'
ON CONFLICT (user_id, role) DO UPDATE SET name = EXCLUDED.name;
