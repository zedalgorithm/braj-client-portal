-- Client ratings and testimonies for completed orders (rate the part-timer)
CREATE TABLE public.order_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  testimony TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_ratings ENABLE ROW LEVEL SECURITY;

-- Clients can insert rating for their own completed+paid order
CREATE POLICY "Clients insert own rating" ON public.order_ratings FOR INSERT TO authenticated
  WITH CHECK (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid() AND status = 'completed' AND payment_received = true)
  );
-- Clients can update their rating
CREATE POLICY "Clients update own rating" ON public.order_ratings FOR UPDATE TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));
-- Everyone can read ratings (for testimonials on main page)
CREATE POLICY "Read ratings anon" ON public.order_ratings FOR SELECT TO anon USING (true);
CREATE POLICY "Read ratings authenticated" ON public.order_ratings FOR SELECT TO authenticated USING (true);
