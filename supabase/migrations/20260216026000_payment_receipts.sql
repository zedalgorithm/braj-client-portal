-- Payment receipts: client uploads receipt, admin confirms on orders
CREATE TABLE public.payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

-- Clients can insert receipt for their own completed, unpaid order
CREATE POLICY "Clients insert own receipt" ON public.payment_receipts FOR INSERT TO authenticated
  WITH CHECK (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid() AND status = 'completed' AND payment_received = false)
  );
-- Clients can update (replace) their receipt for same order
CREATE POLICY "Clients update own receipt" ON public.payment_receipts FOR UPDATE TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));
-- Clients can view own receipts
CREATE POLICY "Clients view own receipts" ON public.payment_receipts FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));
-- Admins can view all receipts
CREATE POLICY "Admins view all receipts" ON public.payment_receipts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-receipts', 'payment-receipts', false);

-- Clients upload to path: {order_id}/{filename} for their own order
CREATE POLICY "Clients upload receipt" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-receipts' AND
    (storage.foldername(name))[1] IN (SELECT id::text FROM public.orders WHERE user_id = auth.uid() AND status = 'completed' AND payment_received = false)
  );
-- Clients can read their own receipts
CREATE POLICY "Clients read own receipt" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-receipts' AND
    ((storage.foldername(name))[1] IN (SELECT id::text FROM public.orders WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  );
-- Admins can read all receipts
CREATE POLICY "Admins read receipts" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-receipts' AND public.has_role(auth.uid(), 'admin'));
