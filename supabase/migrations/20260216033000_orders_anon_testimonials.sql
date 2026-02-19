-- Allow anon to read minimal order data (id, service_type) for orders that have testimonials
-- Used by main page to show "What Our Clients Say" with service type
CREATE POLICY "Anon read orders with testimonials" ON public.orders FOR SELECT TO anon
  USING (id IN (SELECT order_id FROM public.order_ratings WHERE testimony IS NOT NULL));
