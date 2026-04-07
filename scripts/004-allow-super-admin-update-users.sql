-- Allow only super_admin to change roles in `users`
-- Run this after `scripts/001-create-schema.sql`.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'Super admin can update user roles'
  ) THEN
    CREATE POLICY "Super admin can update user roles"
      ON public.users
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1
          FROM public.users u2
          WHERE u2.id = auth.uid()
            AND u2.role = 'super_admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.users u2
          WHERE u2.id = auth.uid()
            AND u2.role = 'super_admin'
        )
      );
  END IF;
END $$;

