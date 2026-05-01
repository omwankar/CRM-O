-- =====================================================
-- Migration 003: Super Admin Features
-- User Management + Punch Request Approval
-- =====================================================

-- === USERS TABLE COLUMNS ===
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;

-- === MISSED PUNCH REQUESTS COLUMNS ===
ALTER TABLE missed_punch_requests ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);
ALTER TABLE missed_punch_requests ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE missed_punch_requests ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE missed_punch_requests ADD COLUMN IF NOT EXISTS requested_clock_in timestamptz;
ALTER TABLE missed_punch_requests ADD COLUMN IF NOT EXISTS requested_clock_out timestamptz;
ALTER TABLE missed_punch_requests ADD COLUMN IF NOT EXISTS actual_duration_minutes integer;

-- === NOTIFICATIONS TABLE ===
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE NOT is_read;

-- === RLS FOR USERS TABLE ===
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "super_admin_full_access_users" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;

-- Super admin can do everything
CREATE POLICY "super_admin_full_access_users" ON users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin'
    )
  );

-- Others can only read their own row
CREATE POLICY "users_read_own" ON users
  FOR SELECT
  USING (id = auth.uid());

-- === RLS FOR MISSED PUNCH REQUESTS ===
ALTER TABLE missed_punch_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_full_access_punch" ON missed_punch_requests;
DROP POLICY IF EXISTS "users_own_punch_requests" ON missed_punch_requests;

-- Super admin full access
CREATE POLICY "super_admin_full_access_punch" ON missed_punch_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin'
    )
  );

-- Others: SELECT and INSERT own rows only
CREATE POLICY "users_own_punch_requests" ON missed_punch_requests
  FOR ALL
  USING (user_id = auth.uid());

-- === RLS FOR NOTIFICATIONS ===
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_notifications" ON notifications;

CREATE POLICY "users_own_notifications" ON notifications
  FOR ALL
  USING (user_id = auth.uid());
