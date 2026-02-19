-- Add parttimer role to app_role enum
ALTER TYPE public.app_role ADD VALUE 'parttimer';

-- Orders: Parttimers can view all client orders (read-only)
DROP POLICY IF EXISTS "Clients see own orders" ON public.orders;
CREATE POLICY "Clients see own orders" ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'parttimer'));

-- Order files: Parttimers can view order files
DROP POLICY IF EXISTS "View order files" ON public.order_files;
CREATE POLICY "View order files" ON public.order_files FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'parttimer') OR
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  );

-- Profiles: Parttimers can view profiles (for client info on orders)
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
CREATE POLICY "Users can view profiles" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'parttimer'));

-- Storage: Parttimers can view input and output files
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
