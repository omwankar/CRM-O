-- Remove the `role_check` constraint that is preventing users from being inserted.
-- This is useful when your app is sending roles like `manager/admin/super_admin`
-- but the DB schema constraint/enum is out of sync.
--
-- Run this in Supabase SQL editor.

-- 1) Drop the check constraint if it exists.
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS role_check;

-- 2) If `role` is an enum (USER-DEFINED type), convert it to TEXT to remove enum restrictions.
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

