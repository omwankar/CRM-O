-- =====================================================
-- Migration 005: Runtime fix for users RLS recursion
-- =====================================================
-- Use this when migration 004 was already applied and login still fails.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_full_access_users" ON users;
DROP POLICY IF EXISTS "admin_read_users" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- Keep users-table policies self-contained to avoid recursive checks.
CREATE POLICY "users_read_own" ON users
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
