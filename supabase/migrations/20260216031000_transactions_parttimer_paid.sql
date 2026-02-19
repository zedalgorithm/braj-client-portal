-- Admin marks part-timer as paid (upload receipt)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS parttimer_paid_at TIMESTAMPTZ;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS parttimer_receipt_path TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS parttimer_receipt_name TEXT;

-- Admins can update transactions (to set parttimer_paid_at and receipt path)
CREATE POLICY "Admins update transactions" ON public.transactions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin uploads receipt to payment-receipts bucket path: admin-to-parttimer/{transaction_id}/{filename}
CREATE POLICY "Admins upload parttimer receipt" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-receipts' AND
    (storage.foldername(name))[1] = 'admin-to-parttimer' AND
    public.has_role(auth.uid(), 'admin')
  );
-- Part-timers can read their own payment receipts (where transaction.assigned_to = them)
CREATE POLICY "Parttimers read own payment receipt" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-receipts' AND
    (storage.foldername(name))[1] = 'admin-to-parttimer' AND
    (storage.foldername(name))[2] IN (SELECT id::text FROM public.transactions WHERE assigned_to = auth.uid())
  );
