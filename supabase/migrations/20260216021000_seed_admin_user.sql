-- Grant admin role to the user with this email.
-- First create the user in Supabase: Authentication → Users → Add user
-- Use email: admin@example.com (or change the email below to match yours)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
