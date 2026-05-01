-- ============================================
-- PROJECT MODULE SUPABASE SCHEMA
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: projects
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT UNIQUE NOT NULL,
  project_name TEXT NOT NULL,
  start_date DATE,
  estimated_end_date DATE,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  requirements_notes TEXT,
  linked_email TEXT,
  status TEXT DEFAULT 'Planned' CHECK (status IN ('Active', 'Planned', 'On Hold', 'Closed')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on project_id for faster lookups
CREATE INDEX idx_projects_project_id ON projects(project_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at) WHERE deleted_at IS NULL;

-- Function to auto-generate project_id as PRJ-YYYY-XXXX
CREATE OR REPLACE FUNCTION generate_project_id()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  padded_seq TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(project_id FROM 10) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM projects
  WHERE project_id LIKE 'PRJ-' || year_part || '-%';
  
  -- Pad the sequence number to 4 digits
  padded_seq := LPAD(seq_num::TEXT, 4, '0');
  
  RETURN 'PRJ-' || year_part || '-' || padded_seq;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate project_id before insert
CREATE OR REPLACE FUNCTION set_project_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.project_id IS NULL OR NEW.project_id = '' THEN
    NEW.project_id := generate_project_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_project_id
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_project_id();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: project_status_history
-- ============================================
CREATE TABLE IF NOT EXISTS project_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_status_history_project_id ON project_status_history(project_id);
CREATE INDEX idx_project_status_history_changed_by ON project_status_history(changed_by);

-- ============================================
-- TABLE: project_employees
-- ============================================
CREATE TABLE IF NOT EXISTS project_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'assigned', 'operations', 'sales')),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_employees_project_id ON project_employees(project_id);
CREATE INDEX idx_project_employees_user_id ON project_employees(user_id);
CREATE INDEX idx_project_employees_role ON project_employees(role);

-- ============================================
-- TABLE: project_attachments
-- ============================================
CREATE TABLE IF NOT EXISTS project_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_attachments_project_id ON project_attachments(project_id);
CREATE INDEX idx_project_attachments_uploaded_by ON project_attachments(uploaded_by);

-- ============================================
-- TABLE: project_emails
-- ============================================
CREATE TABLE IF NOT EXISTS project_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_name TEXT,
  sender_email TEXT,
  subject TEXT,
  body_preview TEXT,
  full_body TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_project_emails_project_id ON project_emails(project_id);
CREATE INDEX idx_project_emails_is_read ON project_emails(is_read);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_emails ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is super_admin or admin
CREATE OR REPLACE FUNCTION is_app_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id AND role IN ('super_admin', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check user's role in a project
CREATE OR REPLACE FUNCTION get_project_role(user_id UUID, project_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM project_employees
    WHERE user_id = user_id AND project_id = project_id
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROJECTS table RLS policies
-- Super admin and admin: full access
CREATE POLICY "projects_super_admin_full_access"
  ON projects
  FOR ALL
  USING (is_app_admin(auth.uid()))
  WITH CHECK (is_app_admin(auth.uid()));

-- Manager: full access to projects they are assigned to
CREATE POLICY "projects_manager_assigned_access"
  ON projects
  FOR ALL
  USING (
    is_app_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM project_employees
      WHERE project_employees.project_id = projects.id
      AND project_employees.user_id = auth.uid()
      AND project_employees.role IN ('admin', 'assigned')
    )
  )
  WITH CHECK (
    is_app_admin(auth.uid())
  );

-- Operations and sales: select only on projects they are listed in
CREATE POLICY "projects_operations_sales_read_access"
  ON projects
  FOR SELECT
  USING (
    is_app_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM project_employees
      WHERE project_employees.project_id = projects.id
      AND project_employees.user_id = auth.uid()
    )
  );

-- PROJECT_STATUS_HISTORY RLS policies
CREATE POLICY "project_status_history_full_access_for_admin"
  ON project_status_history
  FOR ALL
  USING (is_app_admin(auth.uid()));

CREATE POLICY "project_status_history_assigned_access"
  ON project_status_history
  FOR SELECT
  USING (
    is_app_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM project_employees
      WHERE project_employees.project_id = project_status_history.project_id
      AND project_employees.user_id = auth.uid()
    )
  );

-- PROJECT_EMPLOYEES RLS policies
CREATE POLICY "project_employees_full_access_for_admin"
  ON project_employees
  FOR ALL
  USING (is_app_admin(auth.uid()))
  WITH CHECK (is_app_admin(auth.uid()));

CREATE POLICY "project_employees_assigned_access"
  ON project_employees
  FOR SELECT
  USING (
    is_app_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM project_employees pe
      WHERE pe.project_id = project_employees.project_id
      AND pe.user_id = auth.uid()
      AND pe.role IN ('admin', 'assigned')
    )
  );

-- PROJECT_ATTACHMENTS RLS policies
CREATE POLICY "project_attachments_full_access_for_admin"
  ON project_attachments
  FOR ALL
  USING (is_app_admin(auth.uid()))
  WITH CHECK (is_app_admin(auth.uid()));

CREATE POLICY "project_attachments_assigned_access"
  ON project_attachments
  FOR SELECT
  USING (
    is_app_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM project_employees
      WHERE project_employees.project_id = project_attachments.project_id
      AND project_employees.user_id = auth.uid()
    )
  );

CREATE POLICY "project_attachments_upload_for_assigned"
  ON project_attachments
  FOR INSERT
  WITH CHECK (
    is_app_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM project_employees
      WHERE project_employees.project_id = project_attachments.project_id
      AND project_employees.user_id = auth.uid()
      AND project_employees.role IN ('admin', 'assigned')
    )
  );

-- PROJECT_EMAILS RLS policies
CREATE POLICY "project_emails_full_access_for_admin"
  ON project_emails
  FOR ALL
  USING (is_app_admin(auth.uid()))
  WITH CHECK (is_app_admin(auth.uid()));

CREATE POLICY "project_emails_assigned_access"
  ON project_emails
  FOR SELECT
  USING (
    is_app_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM project_employees
      WHERE project_employees.project_id = project_emails.project_id
      AND project_employees.user_id = auth.uid()
    )
  );

CREATE POLICY "project_emails_mark_read_for_assigned"
  ON project_emails
  FOR UPDATE
  USING (
    is_app_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM project_employees
      WHERE project_employees.project_id = project_emails.project_id
      AND project_employees.user_id = auth.uid()
      AND project_employees.role IN ('admin', 'assigned')
    )
  );
