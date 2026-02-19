-- Run in Supabase SQL Editor if you apply migrations manually.
-- Order amount and transaction history (Admin 40% / Part-timer 60%)

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  admin_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  parttimer_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view all transactions" ON public.transactions;
CREATE POLICY "Admins view all transactions" ON public.transactions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins insert transactions" ON public.transactions;
CREATE POLICY "Admins insert transactions" ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Part-timers can view their own payment transactions (assigned_to = their user id)
DROP POLICY IF EXISTS "Parttimers view own transactions" ON public.transactions;
CREATE POLICY "Parttimers view own transactions" ON public.transactions FOR SELECT TO authenticated
  USING (assigned_to = auth.uid());
