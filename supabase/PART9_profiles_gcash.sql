-- Run in Supabase SQL Editor. Add GCash fields + update handle_new_user for part-timer signup.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gcash_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gcash_name TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role public.app_role;
  user_name TEXT;
  gcash_num TEXT;
  gcash_nm TEXT;
BEGIN
  IF (NEW.raw_user_meta_data->>'signup_as_parttimer')::boolean = true THEN
    gcash_num := NEW.raw_user_meta_data->>'gcash_number';
    gcash_nm := NEW.raw_user_meta_data->>'gcash_name';
  END IF;

  INSERT INTO public.profiles (user_id, full_name, email, gcash_number, gcash_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, gcash_num, gcash_nm);

  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  IF (NEW.raw_user_meta_data->>'signup_as_parttimer')::boolean = true THEN
    user_role := 'parttimer'::public.app_role;
  ELSE
    user_role := 'client'::public.app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role, name)
  VALUES (NEW.id, user_role, user_name);

  RETURN NEW;
END;
$$;
