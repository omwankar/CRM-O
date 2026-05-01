-- ============================================================
-- Migration 002: New tables, soft delete columns, pipeline stages
-- ============================================================

-- ============================================================
-- 1. SOFT DELETE COLUMNS (add to existing tables)
-- ============================================================
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE memberships    ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE partnerships   ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE insurance      ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE vendors        ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE buyers         ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ============================================================
-- 2. TASKS (cross-module to-do items)
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  related_table text,
  related_id uuid,
  due_date date,
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status text DEFAULT 'open' CHECK (status IN ('open','in_progress','done','cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- ============================================================
-- 3. COMMENTS (threaded notes on any record)
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body text NOT NULL,
  author_id uuid REFERENCES auth.users(id),
  related_table text NOT NULL,
  related_id uuid NOT NULL,
  parent_id uuid REFERENCES comments(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- ============================================================
-- 4. TAGS (label anything)
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text DEFAULT '#64748b',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  related_table text NOT NULL,
  related_id uuid NOT NULL,
  assigned_at timestamptz DEFAULT now()
);

-- ============================================================
-- 5. PIPELINE STAGES (for Buyers kanban)
-- ============================================================
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  order_index integer NOT NULL,
  color text DEFAULT '#64748b',
  created_at timestamptz DEFAULT now()
);

INSERT INTO pipeline_stages (name, order_index, color) VALUES
  ('Lead', 1, '#3B82F6'),
  ('Contacted', 2, '#8B5CF6'),
  ('Proposal Sent', 3, '#F59E0B'),
  ('Negotiating', 4, '#EF4444'),
  ('Closed Won', 5, '#10B981'),
  ('Closed Lost', 6, '#6B7280')
ON CONFLICT DO NOTHING;

-- Add pipeline columns to buyers
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS pipeline_stage_id uuid REFERENCES pipeline_stages(id);
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS pipeline_notes text;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS pipeline_value numeric(12,2);
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS expected_close_date date;

-- ============================================================
-- 6. EMAIL TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  module text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 7. CUSTOM FIELDS (per module, per org)
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,
  field_name text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text','number','date','boolean','select')),
  options jsonb,
  is_required boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_field_id uuid REFERENCES custom_fields(id) ON DELETE CASCADE,
  related_table text NOT NULL,
  related_id uuid NOT NULL,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 8. SAVED REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  module text NOT NULL,
  filters jsonb,
  columns jsonb,
  created_by uuid REFERENCES auth.users(id),
  is_shared boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_related ON tasks(related_table, related_id);
CREATE INDEX IF NOT EXISTS idx_comments_related ON comments(related_table, related_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_tag_assignments_related ON tag_assignments(related_table, related_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_related ON custom_field_values(related_table, related_id);
CREATE INDEX IF NOT EXISTS idx_buyers_pipeline_stage ON buyers(pipeline_stage_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;

-- Tasks: super_admin/admin/manager full access, others see own assigned
CREATE POLICY "Admins can manage tasks" ON tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
  );

CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (
    assigned_to = auth.uid() OR created_by = auth.uid()
  );

CREATE POLICY "Users can create tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (
    assigned_to = auth.uid() OR created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
  );

-- Comments: admins full, users can create/edit own
CREATE POLICY "Users can view comments" ON comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Admins can delete comments" ON comments
  FOR DELETE USING (
    author_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- Tags: admins manage, all can view
CREATE POLICY "Anyone can view tags" ON tags
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage tags" ON tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- Tag assignments: admins manage, all can view
CREATE POLICY "Anyone can view tag assignments" ON tag_assignments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage tag assignments" ON tag_assignments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
  );

-- Pipeline stages: all can view, admins manage
CREATE POLICY "Anyone can view pipeline stages" ON pipeline_stages
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage pipeline stages" ON pipeline_stages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- Email templates: all can view, admins manage
CREATE POLICY "Anyone can view email templates" ON email_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage email templates" ON email_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- Custom fields: all can view, admins manage
CREATE POLICY "Anyone can view custom fields" ON custom_fields
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage custom fields" ON custom_fields
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- Custom field values: all can view, admins manage
CREATE POLICY "Anyone can view custom field values" ON custom_field_values
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage custom field values" ON custom_field_values
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager'))
  );

-- Saved reports: owner or shared, admins full
CREATE POLICY "Users can view own or shared reports" ON saved_reports
  FOR SELECT USING (
    created_by = auth.uid() OR is_shared = true OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Users can create reports" ON saved_reports
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own reports" ON saved_reports
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Admins can delete reports" ON saved_reports
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- ============================================================
-- TRIGGER: auto-update updated_at for new tables
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_custom_field_values_updated_at
  BEFORE UPDATE ON custom_field_values
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
