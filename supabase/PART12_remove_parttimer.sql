-- ============================================================
-- Admin can remove an approved part-timer
-- Drops the parttimer role, service access, and unassigns in-progress orders.
-- The account remains usable as a client.
-- Safe to run multiple times (CREATE OR REPLACE).
-- ============================================================

CREATE OR REPLACE FUNCTION public.remove_parttimer(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can remove part-timers';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'parttimer'
  ) THEN
    RAISE EXCEPTION 'User is not a part-timer';
  END IF;

  DELETE FROM public.parttimer_allowed_services WHERE parttimer_id = _user_id;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'parttimer';

  INSERT INTO public.user_roles (user_id, role, name)
  SELECT _user_id, 'client'::public.app_role, COALESCE((SELECT full_name FROM public.profiles WHERE user_id = _user_id), 'Client')
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.orders
  SET assigned_to = NULL, status = 'pending'
  WHERE assigned_to = _user_id AND status = 'in_progress';
END;
$$;
