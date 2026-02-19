-- ============================================================
-- Run this FIRST in Supabase SQL Editor. Click Run once.
-- Wait for "Success" - then run PART2_policies_and_seeds.sql
--
-- Optional: Check enum values first with:
--   SELECT enumlabel FROM pg_enum e
--   JOIN pg_type t ON e.enumtypid = t.oid
--   WHERE t.typname = 'app_role';
-- ============================================================
ALTER TYPE public.app_role ADD VALUE 'parttimer';
