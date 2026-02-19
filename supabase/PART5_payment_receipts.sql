-- Run this in Supabase SQL Editor if you apply migrations manually.
-- Payment receipts: client uploads receipt, admin confirms on orders

CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients insert own receipt" ON public.payment_receipts;
CREATE POLICY "Clients insert own receipt" ON public.payment_receipts FOR INSERT TO authenticated
  WITH CHECK (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid() AND status = 'completed' AND payment_received = false)
  );
DROP POLICY IF EXISTS "Clients update own receipt" ON public.payment_receipts;
CREATE POLICY "Clients update own receipt" ON public.payment_receipts FOR UPDATE TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Clients view own receipts" ON public.payment_receipts;
CREATE POLICY "Clients view own receipts" ON public.payment_receipts FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins view all receipts" ON public.payment_receipts;
CREATE POLICY "Admins view all receipts" ON public.payment_receipts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket (run once; may already exist)
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment-receipts bucket
DROP POLICY IF EXISTS "Clients upload receipt" ON storage.objects;
CREATE POLICY "Clients upload receipt" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-receipts' AND
    (storage.foldername(name))[1] IN (SELECT id::text FROM public.orders WHERE user_id = auth.uid() AND status = 'completed' AND payment_received = false)
  );
DROP POLICY IF EXISTS "Clients read own receipt" ON storage.objects;
CREATE POLICY "Clients read own receipt" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-receipts' AND
    ((storage.foldername(name))[1] IN (SELECT id::text FROM public.orders WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  );
DROP POLICY IF EXISTS "Admins read receipts" ON storage.objects;
CREATE POLICY "Admins read receipts" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-receipts' AND public.has_role(auth.uid(), 'admin'));
