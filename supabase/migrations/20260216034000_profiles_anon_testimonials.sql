-- Allow anon to read client names (full_name) from profiles for orders that have testimonials
-- Used by main page to show "What Our Clients Say" with client names
CREATE POLICY "Anon read profiles with testimonials" ON public.profiles FOR SELECT TO anon
  USING (
    user_id IN (
      SELECT user_id FROM public.orders
      WHERE id IN (SELECT order_id FROM public.order_ratings WHERE testimony IS NOT NULL)
    )
  );
