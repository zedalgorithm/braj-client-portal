-- When user signs up with signup_as_parttimer in metadata, create part-timer role instead of client
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
    user_role := 'parttimer'::public.app_role;
  ELSE
    user_role := 'client'::public.app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role, name)
  VALUES (NEW.id, user_role, user_name);

  RETURN NEW;
END;
$$;
