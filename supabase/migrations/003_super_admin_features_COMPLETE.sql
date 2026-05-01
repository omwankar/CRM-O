-- =====================================================
-- Migration 003: Super Admin Features (COMPLETE)
-- User Management + Punch Request Approval
-- Run this entire file in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: USERS TABLE ENHANCEMENTS
-- =====================================================

-- Add columns for user management
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;

-- Ensure role column exists and has proper constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role text DEFAULT 'user';
  END IF;
END $$;

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);

-- =====================================================
-- PART 2: MISSED PUNCH REQUESTS ENHANCEMENTS
-- =====================================================

-- Add columns for approval workflow
ALTER TABLE missed_punch_requests ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);
ALTER TABLE missed_punch_requests ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE missed_punch_requests ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE missed_punch_requests ADD COLUMN IF NOT EXISTS requested_clock_in timestamptz;
ALTER TABLE missed_punch_requests ADD COLUMN IF NOT EXISTS requested_clock_out timestamptz;
ALTER TABLE missed_punch_requests ADD COLUMN IF NOT EXISTS actual_duration_minutes integer;

-- Ensure status column exists with proper default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'missed_punch_requests' AND column_name = 'status'
  ) THEN
    ALTER TABLE missed_punch_requests ADD COLUMN status text DEFAULT 'pending';
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_missed_punch_status ON missed_punch_requests(status);
CREATE INDEX IF NOT EXISTS idx_missed_punch_reviewed_by ON missed_punch_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_missed_punch_user_status ON missed_punch_requests(user_id, status);

-- =====================================================
-- PART 3: NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- =====================================================
-- PART 4: ACTIVITY LOGS TABLE (for audit trail)
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_table ON activity_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_record ON activity_logs(table_name, record_id);

-- =====================================================
-- PART 5: RLS POLICIES FOR USERS TABLE
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "super_admin_full_access_users" ON users;
DROP POLICY IF EXISTS "admin_read_users" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;

-- Super admin: full access to all users
CREATE POLICY "super_admin_full_access_users" ON users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin'
    )
  );

-- Regular users: can only read their own row
CREATE POLICY "users_read_own" ON users
  FOR SELECT
  USING (id = auth.uid());

-- =====================================================
-- PART 6: RLS POLICIES FOR MISSED PUNCH REQUESTS
-- =====================================================

ALTER TABLE missed_punch_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_full_access_punch" ON missed_punch_requests;
DROP POLICY IF EXISTS "users_own_punch_requests" ON missed_punch_requests;

-- Super admin: full access to all punch requests
CREATE POLICY "super_admin_full_access_punch" ON missed_punch_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin'
    )
  );

-- Regular users: can only access their own punch requests
CREATE POLICY "users_own_punch_requests" ON missed_punch_requests
  FOR ALL
  USING (user_id = auth.uid());

-- =====================================================
-- PART 7: RLS POLICIES FOR NOTIFICATIONS
-- =====================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_notifications" ON notifications;

CREATE POLICY "users_own_notifications" ON notifications
  FOR ALL
  USING (user_id = auth.uid());

-- =====================================================
-- PART 8: RLS POLICIES FOR ACTIVITY LOGS
-- =====================================================

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_read_logs" ON activity_logs;
DROP POLICY IF EXISTS "users_own_logs" ON activity_logs;

-- Super admin: can read all logs
CREATE POLICY "super_admin_read_logs" ON activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin'
    )
  );

-- Users: can only read their own logs
CREATE POLICY "users_own_logs" ON activity_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- =====================================================
-- PART 9: TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =====================================================

-- Function to update last_login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET last_login = now() WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.sessions;

-- Note: To track logins, you'll need to call update_last_login() from your app
-- or use Supabase webhooks

-- =====================================================
-- PART 10: HELPER FUNCTIONS
-- =====================================================

-- Function to check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid uuid)
RETURNS BOOLEAN AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM users WHERE id = user_uuid;
  RETURN user_role = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 11: SEED DATA (Optional)
-- =====================================================

-- If you need to make an existing user a super_admin, uncomment and run:
-- UPDATE users SET role = 'super_admin' WHERE email = 'your-email@example.com';

-- =====================================================
-- VERIFICATION QUERIES (Run these to verify setup)
-- =====================================================

-- Check users table structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';

-- Check missed_punch_requests table structure  
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'missed_punch_requests';

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename IN ('users', 'missed_punch_requests', 'notifications', 'activity_logs');
