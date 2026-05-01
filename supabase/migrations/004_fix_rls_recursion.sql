-- =====================================================
-- Migration 004: Fix RLS Infinite Recursion
-- =====================================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "super_admin_full_access_users" ON users;
DROP POLICY IF EXISTS "admin_read_users" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "super_admin_full_access_punch" ON missed_punch_requests;

-- Create a security definer function to check super_admin status
-- This function runs with the privileges of the creator (bypasses RLS)
CREATE OR REPLACE FUNCTION is_super_admin_check(user_uuid uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = user_uuid;
  RETURN user_role = 'super_admin';
END;
$$;

-- IMPORTANT:
-- Never call a function that reads "users" from a policy on "users" itself.
-- That causes recursive policy evaluation.
-- Keep users-table policies self-contained.
CREATE POLICY "users_read_own" ON users
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Recreate punch request policy
CREATE POLICY "super_admin_full_access_punch" ON missed_punch_requests
  FOR ALL
  USING (is_super_admin_check(auth.uid()));

-- Fix activity logs policy too
DROP POLICY IF EXISTS "super_admin_read_logs" ON activity_logs;
CREATE POLICY "super_admin_read_logs" ON activity_logs
  FOR SELECT
  USING (is_super_admin_check(auth.uid()));
