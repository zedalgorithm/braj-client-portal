-- ============================================================
-- Part-timer workflow: claim orders, upload finished files
-- Run after PART2
-- ============================================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Admins update orders" ON public.orders;
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parttimers update assigned orders" ON public.orders FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'parttimer') AND
    (assigned_to IS NULL OR assigned_to = auth.uid())
  );

DROP POLICY IF EXISTS "Upload input files" ON public.order_files;
CREATE POLICY "Upload input files" ON public.order_files FOR INSERT TO authenticated
  WITH CHECK (
    (uploaded_by = auth.uid() AND file_type = 'input' AND order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()))
    OR (uploaded_by = auth.uid() AND file_type = 'output' AND public.has_role(auth.uid(), 'admin'))
    OR (uploaded_by = auth.uid() AND file_type = 'output' AND public.has_role(auth.uid(), 'parttimer') AND order_id IN (SELECT id FROM public.orders WHERE assigned_to = auth.uid()))
  );

DROP POLICY IF EXISTS "Admins upload output files" ON storage.objects;
CREATE POLICY "Admins upload output files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'output-files' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'parttimer')));
