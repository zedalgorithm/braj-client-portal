-- Part-timer signups get pending_parttimer until admin approves; they can log in but only see "pending approval" until then.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'app_role' AND e.enumlabel = 'pending_parttimer') THEN
    ALTER TYPE public.app_role ADD VALUE 'pending_parttimer';
  END IF;
END;
$$;

-- When user signs up as part-timer, assign pending_parttimer (not parttimer) so they cannot access part-timer dashboard until admin approves
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role public.app_role;
  user_name TEXT;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);

  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  IF (NEW.raw_user_meta_data->>'signup_as_parttimer')::boolean = true THEN
    user_role := 'pending_parttimer'::public.app_role;
  ELSE
    user_role := 'client'::public.app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role, name)
  VALUES (NEW.id, user_role, user_name);

  RETURN NEW;
END;
$$;

-- Admin-only: approve pending part-timer (replaces pending_parttimer with parttimer)
CREATE OR REPLACE FUNCTION public.approve_pending_parttimer(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve part-timers';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'pending_parttimer';
  INSERT INTO public.user_roles (user_id, role, name)
  SELECT _user_id, 'parttimer'::public.app_role, COALESCE((SELECT full_name FROM public.profiles WHERE user_id = _user_id), 'Part-timer');
END;
$$;
