-- Add name column to user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS name TEXT;

-- Update handle_new_user to set name when creating client role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);

  INSERT INTO public.user_roles (user_id, role, name)
  VALUES (NEW.id, 'client', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  RETURN NEW;
END;
$$;
