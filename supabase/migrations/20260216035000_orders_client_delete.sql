-- Clients can delete their own pending orders (mistake orders)
CREATE POLICY "Clients delete own pending orders" ON public.orders FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');
