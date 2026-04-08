-- Drops any CHECK constraints on `public.users` that contain "role" in the constraint name.
-- This is a stronger version of `006-remove-role-check.sql` in case the constraint name differs.
--
-- Run this in Supabase SQL editor.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.users'::regclass
      AND contype = 'c' -- 'c' = check constraint
      AND conname ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

-- If `role` is an enum type, convert it to TEXT so future inserts never fail due to enum mismatch.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'role'
      AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE public.users
      ALTER COLUMN role TYPE text
      USING role::text;
  END IF;
END $$;

