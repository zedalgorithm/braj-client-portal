-- Test script: Manually create a pending part-timer user for testing
-- Run this in Supabase SQL Editor after applying the migration

-- Option 1: Convert an existing user to pending part-timer
-- Replace 'USER_EMAIL_HERE' with the email of an existing user
-- UPDATE public.user_roles 
-- SET role = 'pending_parttimer'
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'USER_EMAIL_HERE')
--   AND role = 'parttimer';

-- Option 2: Create a new test user as pending part-timer
-- First, create the auth user (you'll need to do this via Supabase Auth UI or API)
-- Then run this to add the pending_parttimer role:
-- INSERT INTO public.user_roles (user_id, role, name)
-- VALUES (
--   'USER_ID_HERE', -- Replace with the auth.users.id from the user you just created
--   'pending_parttimer',
--   'Test Pending Part-timer'
-- );

-- Option 3: Check existing pending part-timers
SELECT 
  ur.user_id,
  ur.role,
  ur.name,
  p.email,
  p.full_name
FROM public.user_roles ur
JOIN public.profiles p ON ur.user_id = p.user_id
WHERE ur.role = 'pending_parttimer';

-- Option 4: List all part-timers (both approved and pending)
SELECT 
  ur.user_id,
  ur.role,
  ur.name,
  p.email,
  p.full_name,
  CASE 
    WHEN ur.role = 'pending_parttimer' THEN 'Pending Approval'
    WHEN ur.role = 'parttimer' THEN 'Approved'
    ELSE 'Unknown'
  END as status
FROM public.user_roles ur
JOIN public.profiles p ON ur.user_id = p.user_id
WHERE ur.role IN ('parttimer', 'pending_parttimer')
ORDER BY ur.role DESC, p.full_name;
