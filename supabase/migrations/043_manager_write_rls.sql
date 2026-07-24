-- ============================================================================
-- 043: Align RLS helper with simplified roles (manager can write)
-- ============================================================================
-- After 018_simplify_roles, writers are manager + super_admin.
-- is_admin_or_super_admin only allowed super_admin/admin, so managers
-- failed inserts via direct Supabase client (e.g. documents upload).

CREATE OR REPLACE FUNCTION public.is_admin_or_super_admin(user_uuid uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = user_uuid LIMIT 1;
  -- 'admin' kept for any leftover legacy rows; 'manager' is the current write role
  RETURN COALESCE(user_role, '') IN ('super_admin', 'admin', 'manager');
END;
$$;

COMMENT ON FUNCTION public.is_admin_or_super_admin(uuid) IS
  'True when user is manager, super_admin, or legacy admin — used by module write RLS.';
