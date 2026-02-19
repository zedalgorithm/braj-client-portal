-- Run in Supabase SQL Editor. Part-timers can view their own payment transactions.
DROP POLICY IF EXISTS "Parttimers view own transactions" ON public.transactions;
CREATE POLICY "Parttimers view own transactions" ON public.transactions FOR SELECT TO authenticated
  USING (assigned_to = auth.uid());
