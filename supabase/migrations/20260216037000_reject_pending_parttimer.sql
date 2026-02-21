-- Admin-only: reject pending part-timer (remove pending_parttimer, add client so they can use the app as client)
CREATE OR REPLACE FUNCTION public.reject_pending_parttimer(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can reject part-timer applications';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'pending_parttimer';
  INSERT INTO public.user_roles (user_id, role, name)
  SELECT _user_id, 'client'::public.app_role, COALESCE((SELECT full_name FROM public.profiles WHERE user_id = _user_id), 'Client')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
