-- ============================================================
-- Decoy test accounts for development / staging environments.
--
-- These accounts are fake, throwaway credentials for testing.
--
-- Required setup before this migration can fully apply:
--   1. Create the auth users in Supabase:
--      - Authentication → Users → Add user
--        Email: admin@decoy.local        Password: <set a password>
--        Email: client@decoy.local       Password: <set a password>
--   2. Then run this migration in the Supabase SQL editor:
--      (or via `supabase db push` / supabase migration apply)
--
-- What this migration does:
--   - Grants the `admin` role to the decoy admin user
--   - Grants the `client`  role to the decoy user
--
-- Safe to run multiple times (ON CONFLICT DO NOTHING).
-- ============================================================

-- ---------- Decoy admin ----------
INSERT INTO public.user_roles (user_id, role, name)
SELECT id, 'admin'::public.app_role, 'Decoy Admin'
FROM auth.users
WHERE email = 'admin@decoy.local'
ON CONFLICT (user_id, role) DO NOTHING;

-- ---------- Decoy regular client ----------
INSERT INTO public.user_roles (user_id, role, name)
SELECT id, 'client'::public.app_role, 'Decoy Client'
FROM auth.users
WHERE email = 'client@decoy.local'
ON CONFLICT (user_id, role) DO NOTHING;
