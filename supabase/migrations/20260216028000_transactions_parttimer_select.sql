-- Part-timers can view their own payment transactions (assigned_to = their user id)
CREATE POLICY "Parttimers view own transactions" ON public.transactions FOR SELECT TO authenticated
  USING (assigned_to = auth.uid());
