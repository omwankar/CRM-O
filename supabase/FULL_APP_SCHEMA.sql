-- ============================================================
-- FULL APP SCHEMA (SAFE + IDEMPOTENT) FOR SUPABASE
-- Run this whole file in Supabase SQL Editor.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- Extensions
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- Helpers
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = user_uuid LIMIT 1;
  RETURN COALESCE(user_role, '') = 'super_admin';
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_super_admin(user_uuid uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = user_uuid LIMIT 1;
  RETURN COALESCE(user_role, '') IN ('super_admin', 'admin');
END;
$$;

-- ------------------------------------------------------------
-- Core users table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'manager',
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  approved BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'manager';
UPDATE public.users SET role = 'manager' WHERE role IS NULL;
ALTER TABLE public.users ALTER COLUMN role SET NOT NULL;

-- Remove legacy role constraints/enums that can block app inserts/updates
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS role_check;
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.users'::regclass
      AND contype = 'c'
      AND conname ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

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
      ALTER COLUMN role TYPE TEXT
      USING role::text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON public.users(invited_by);

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- CRM module tables
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL,
  issuing_authority TEXT,
  issue_date DATE,
  expiry_date DATE,
  certificate_number TEXT,
  credential_id TEXT,
  certificate_file TEXT,
  status TEXT DEFAULT 'active',
  document_url TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  membership_type TEXT,
  member_id TEXT,
  membership_number TEXT,
  membership_id TEXT,
  membership_fee NUMERIC(15,2),
  membership_level TEXT,
  join_date DATE,
  renewal_date DATE,
  status TEXT DEFAULT 'active',
  benefits TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name TEXT,
  partner_company_name TEXT,
  partner_type TEXT,
  partnership_type TEXT,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  description TEXT,
  terms_url TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT,
  policy_type TEXT,
  insurance_type TEXT,
  provider_name TEXT,
  provider TEXT,
  policy_number TEXT,
  coverage_amount NUMERIC(15,2),
  premium_amount NUMERIC(15,2),
  premium NUMERIC(15,2),
  start_date DATE,
  expiry_date DATE,
  end_date DATE,
  renewal_date DATE,
  status TEXT DEFAULT 'active',
  document_url TEXT,
  agent_name TEXT,
  agent_phone TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name TEXT NOT NULL,
  vendor_type TEXT,
  category TEXT,
  contact_person TEXT,
  contact_email TEXT,
  email TEXT,
  contact_phone TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  zip_code TEXT,
  country TEXT,
  website TEXT,
  description TEXT,
  contract_url TEXT,
  payment_terms TEXT,
  vendor_portal_link TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_name TEXT NOT NULL,
  contact_person TEXT,
  contact_email TEXT,
  email TEXT,
  contact_phone TEXT,
  phone TEXT,
  company_type TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  zip_code TEXT,
  country TEXT,
  website TEXT,
  industry TEXT,
  description TEXT,
  credit_limit NUMERIC(15,2),
  buyer_portal_link TEXT,
  pipeline_stage_id UUID,
  pipeline_notes TEXT,
  pipeline_value NUMERIC(12,2),
  expected_close_date DATE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure pipeline fields exist even when buyers table already existed
ALTER TABLE public.buyers
  ADD COLUMN IF NOT EXISTS pipeline_stage_id UUID,
  ADD COLUMN IF NOT EXISTS pipeline_notes TEXT,
  ADD COLUMN IF NOT EXISTS pipeline_value NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS expected_close_date DATE;

CREATE TABLE IF NOT EXISTS public.crm_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.buyers(id) ON DELETE CASCADE,
  subscription_name TEXT NOT NULL,
  subscription_type TEXT,
  start_date DATE,
  renewal_date DATE,
  billing_amount NUMERIC(15,2),
  billing_frequency TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  related_table TEXT,
  related_id UUID,
  module TEXT,
  record_id UUID,
  document_name TEXT,
  file_name TEXT,
  document_type TEXT,
  file_url TEXT,
  file_path TEXT,
  file_size BIGINT,
  file_type TEXT,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  expiry_date DATE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  related_table TEXT,
  related_id UUID,
  title TEXT NOT NULL,
  message TEXT,
  days_before_expiry INT DEFAULT 30,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  changes JSONB,
  old_data JSONB,
  new_data JSONB,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  setting_name TEXT UNIQUE,
  setting_value TEXT,
  data_type TEXT,
  cert_expiry_days INT DEFAULT 30,
  membership_expiry_days INT DEFAULT 30,
  insurance_expiry_days INT DEFAULT 30,
  alert_email TEXT,
  enable_email_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_settings_user_id ON public.admin_settings(user_id);

-- ------------------------------------------------------------
-- Clock / calendar
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clock_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.missed_punch_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  requested_clock_in TIMESTAMPTZ,
  requested_clock_out TIMESTAMPTZ,
  actual_duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'holiday',
  start_time TIME,
  end_time TIME,
  description TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Projects module
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT UNIQUE,
  project_name TEXT NOT NULL,
  start_date DATE,
  estimated_end_date DATE,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  requirements_notes TEXT,
  linked_email TEXT,
  status TEXT DEFAULT 'Planned',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.project_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_name TEXT,
  sender_email TEXT,
  subject TEXT,
  body_preview TEXT,
  full_body TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

CREATE OR REPLACE FUNCTION public.generate_project_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(project_id FROM 10) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.projects
  WHERE project_id LIKE 'PRJ-' || year_part || '-%';
  RETURN 'PRJ-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_project_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.project_id IS NULL OR NEW.project_id = '' THEN
    NEW.project_id := public.generate_project_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_project_id ON public.projects;
CREATE TRIGGER trg_set_project_id
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_project_id();

-- ------------------------------------------------------------
-- Enhancements module tables
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  related_table TEXT,
  related_id UUID,
  due_date DATE,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  body TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  related_table TEXT NOT NULL,
  related_id UUID NOT NULL,
  parent_id UUID REFERENCES public.comments(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#64748b',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  related_table TEXT NOT NULL,
  related_id UUID NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  color TEXT DEFAULT '#64748b',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  module TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  options JSONB,
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_field_id UUID REFERENCES public.custom_fields(id) ON DELETE CASCADE,
  related_table TEXT NOT NULL,
  related_id UUID NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  filters JSONB,
  columns JSONB,
  created_by UUID REFERENCES auth.users(id),
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure relationship columns used in backend joins exist
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS assigned_to UUID,
  ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS uploaded_by UUID;

-- Ensure FK relationships for PostgREST joins to public.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'tasks'
      AND constraint_name = 'tasks_assigned_to_users_fkey'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_assigned_to_users_fkey
      FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'tasks'
      AND constraint_name = 'tasks_created_by_users_fkey'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_created_by_users_fkey
      FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'activity_logs'
      AND constraint_name = 'activity_logs_user_id_users_fkey'
  ) THEN
    ALTER TABLE public.activity_logs
      ADD CONSTRAINT activity_logs_user_id_users_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'calendar_events'
      AND constraint_name = 'calendar_events_created_by_users_fkey'
  ) THEN
    ALTER TABLE public.calendar_events
      ADD CONSTRAINT calendar_events_created_by_users_fkey
      FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'documents'
      AND constraint_name = 'documents_uploaded_by_users_fkey'
  ) THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT documents_uploaded_by_users_fkey
      FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add missing buyers FK after pipeline_stages is guaranteed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'buyers'
      AND constraint_name = 'buyers_pipeline_stage_id_fkey'
  ) THEN
    ALTER TABLE public.buyers
      ADD CONSTRAINT buyers_pipeline_stage_id_fkey
      FOREIGN KEY (pipeline_stage_id)
      REFERENCES public.pipeline_stages(id);
  END IF;
END $$;

INSERT INTO public.pipeline_stages (name, order_index, color)
VALUES
  ('Lead', 1, '#3B82F6'),
  ('Contacted', 2, '#8B5CF6'),
  ('Proposal Sent', 3, '#F59E0B'),
  ('Negotiating', 4, '#EF4444'),
  ('Closed Won', 5, '#10B981'),
  ('Closed Lost', 6, '#6B7280')
ON CONFLICT DO NOTHING;

-- Ensure status columns exist on legacy tables before indexing/policies
ALTER TABLE public.certifications
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.partnerships
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.insurance
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.crm_subscriptions
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.missed_punch_requests
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.leave_requests
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Planned';
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS vendor_type TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.buyers
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS related_table TEXT,
  ADD COLUMN IF NOT EXISTS related_id UUID;
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS related_table TEXT,
  ADD COLUMN IF NOT EXISTS related_id UUID;
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS related_table TEXT,
  ADD COLUMN IF NOT EXISTS related_id UUID;
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS related_table TEXT,
  ADD COLUMN IF NOT EXISTS related_id UUID;
ALTER TABLE public.tag_assignments
  ADD COLUMN IF NOT EXISTS related_table TEXT,
  ADD COLUMN IF NOT EXISTS related_id UUID;
ALTER TABLE public.custom_field_values
  ADD COLUMN IF NOT EXISTS related_table TEXT,
  ADD COLUMN IF NOT EXISTS related_id UUID;

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_certifications_user_id ON public.certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_certifications_expiry_date ON public.certifications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_certifications_status ON public.certifications(status);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_renewal_date ON public.memberships(renewal_date);
CREATE INDEX IF NOT EXISTS idx_partnerships_status ON public.partnerships(status);
CREATE INDEX IF NOT EXISTS idx_insurance_expiry_date ON public.insurance(expiry_date);
CREATE INDEX IF NOT EXISTS idx_insurance_status ON public.insurance(status);
CREATE INDEX IF NOT EXISTS idx_vendors_vendor_type ON public.vendors(vendor_type);
CREATE INDEX IF NOT EXISTS idx_buyers_industry ON public.buyers(industry);
CREATE INDEX IF NOT EXISTS idx_buyers_pipeline_stage ON public.buyers(pipeline_stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_subscriptions_buyer_id ON public.crm_subscriptions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_crm_subscriptions_renewal_date ON public.crm_subscriptions(renewal_date);
CREATE INDEX IF NOT EXISTS idx_documents_related ON public.documents(related_table, related_id);
CREATE INDEX IF NOT EXISTS idx_alerts_related ON public.alerts(related_table, related_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_clock_sessions_user_id ON public.clock_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_missed_punch_status ON public.missed_punch_requests(status);
CREATE INDEX IF NOT EXISTS idx_missed_punch_user_status ON public.missed_punch_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_requested_by ON public.leave_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);

CREATE INDEX IF NOT EXISTS idx_projects_project_id ON public.projects(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON public.projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_project_status_history_project_id ON public.project_status_history(project_id);
CREATE INDEX IF NOT EXISTS idx_project_employees_project_id ON public.project_employees(project_id);
CREATE INDEX IF NOT EXISTS idx_project_employees_user_id ON public.project_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_project_attachments_project_id ON public.project_attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_emails_project_id ON public.project_emails(project_id);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_related ON public.tasks(related_table, related_id);
CREATE INDEX IF NOT EXISTS idx_comments_related ON public.comments(related_table, related_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_tag_assignments_related ON public.tag_assignments(related_table, related_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_related ON public.custom_field_values(related_table, related_id);

-- ------------------------------------------------------------
-- Triggers (updated_at)
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_certifications_updated_at ON public.certifications;
CREATE TRIGGER trg_certifications_updated_at BEFORE UPDATE ON public.certifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_memberships_updated_at ON public.memberships;
CREATE TRIGGER trg_memberships_updated_at BEFORE UPDATE ON public.memberships
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_partnerships_updated_at ON public.partnerships;
CREATE TRIGGER trg_partnerships_updated_at BEFORE UPDATE ON public.partnerships
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_insurance_updated_at ON public.insurance;
CREATE TRIGGER trg_insurance_updated_at BEFORE UPDATE ON public.insurance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_vendors_updated_at ON public.vendors;
CREATE TRIGGER trg_vendors_updated_at BEFORE UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_buyers_updated_at ON public.buyers;
CREATE TRIGGER trg_buyers_updated_at BEFORE UPDATE ON public.buyers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_crm_subscriptions_updated_at ON public.crm_subscriptions;
CREATE TRIGGER trg_crm_subscriptions_updated_at BEFORE UPDATE ON public.crm_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_alerts_updated_at ON public.alerts;
CREATE TRIGGER trg_alerts_updated_at BEFORE UPDATE ON public.alerts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_admin_settings_updated_at ON public.admin_settings;
CREATE TRIGGER trg_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_clock_sessions_updated_at ON public.clock_sessions;
CREATE TRIGGER trg_clock_sessions_updated_at BEFORE UPDATE ON public.clock_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_comments_updated_at ON public.comments;
CREATE TRIGGER trg_comments_updated_at BEFORE UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_custom_field_values_updated_at ON public.custom_field_values;
CREATE TRIGGER trg_custom_field_values_updated_at BEFORE UPDATE ON public.custom_field_values
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- RLS enable
-- ------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clock_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missed_punch_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- RLS policies (drop + recreate)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "users_self_or_admin_select" ON public.users;
DROP POLICY IF EXISTS "users_super_admin_update" ON public.users;
CREATE POLICY "users_self_or_admin_select" ON public.users
  FOR SELECT USING (id = auth.uid() OR public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "users_super_admin_update" ON public.users
  FOR UPDATE USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "clock_sessions_select_own" ON public.clock_sessions;
DROP POLICY IF EXISTS "clock_sessions_insert_own" ON public.clock_sessions;
DROP POLICY IF EXISTS "clock_sessions_update_own" ON public.clock_sessions;
CREATE POLICY "clock_sessions_select_own" ON public.clock_sessions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "clock_sessions_insert_own" ON public.clock_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "clock_sessions_update_own" ON public.clock_sessions
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin_or_super_admin(auth.uid()));

DROP POLICY IF EXISTS "missed_punch_select" ON public.missed_punch_requests;
DROP POLICY IF EXISTS "missed_punch_insert" ON public.missed_punch_requests;
DROP POLICY IF EXISTS "missed_punch_update_heads" ON public.missed_punch_requests;
CREATE POLICY "missed_punch_select" ON public.missed_punch_requests
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "missed_punch_insert" ON public.missed_punch_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "missed_punch_update_heads" ON public.missed_punch_requests
  FOR UPDATE USING (public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

DROP POLICY IF EXISTS "calendar_events_select_auth" ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_events_insert_heads" ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_events_update_heads" ON public.calendar_events;
CREATE POLICY "calendar_events_select_auth" ON public.calendar_events
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "calendar_events_insert_heads" ON public.calendar_events
  FOR INSERT WITH CHECK (public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "calendar_events_update_heads" ON public.calendar_events
  FOR UPDATE USING (public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "notifications_insert_own" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin_or_super_admin(auth.uid()));

DROP POLICY IF EXISTS "leave_requests_select" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_insert" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_update_heads" ON public.leave_requests;
CREATE POLICY "leave_requests_select" ON public.leave_requests
  FOR SELECT USING (auth.uid() = requested_by OR public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "leave_requests_insert" ON public.leave_requests
  FOR INSERT WITH CHECK (auth.uid() = requested_by OR public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "leave_requests_update_heads" ON public.leave_requests
  FOR UPDATE USING (public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

DROP POLICY IF EXISTS "projects_read_assigned_or_admin" ON public.projects;
DROP POLICY IF EXISTS "projects_write_admin_only" ON public.projects;
CREATE POLICY "projects_read_assigned_or_admin" ON public.projects
  FOR SELECT USING (
    public.is_admin_or_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.project_employees pe
      WHERE pe.project_id = projects.id
        AND pe.user_id = auth.uid()
    )
  );
CREATE POLICY "projects_write_admin_only" ON public.projects
  FOR ALL USING (public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

DROP POLICY IF EXISTS "project_status_read" ON public.project_status_history;
DROP POLICY IF EXISTS "project_status_write_admin" ON public.project_status_history;
CREATE POLICY "project_status_read" ON public.project_status_history
  FOR SELECT USING (
    public.is_admin_or_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.project_employees pe
      WHERE pe.project_id = project_status_history.project_id
        AND pe.user_id = auth.uid()
    )
  );
CREATE POLICY "project_status_write_admin" ON public.project_status_history
  FOR ALL USING (public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

DROP POLICY IF EXISTS "project_employees_read" ON public.project_employees;
DROP POLICY IF EXISTS "project_employees_write_admin" ON public.project_employees;
CREATE POLICY "project_employees_read" ON public.project_employees
  FOR SELECT USING (
    public.is_admin_or_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.project_employees pe
      WHERE pe.project_id = project_employees.project_id
        AND pe.user_id = auth.uid()
    )
  );
CREATE POLICY "project_employees_write_admin" ON public.project_employees
  FOR ALL USING (public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

DROP POLICY IF EXISTS "project_attachments_read" ON public.project_attachments;
DROP POLICY IF EXISTS "project_attachments_write" ON public.project_attachments;
CREATE POLICY "project_attachments_read" ON public.project_attachments
  FOR SELECT USING (
    public.is_admin_or_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.project_employees pe
      WHERE pe.project_id = project_attachments.project_id
        AND pe.user_id = auth.uid()
    )
  );
CREATE POLICY "project_attachments_write" ON public.project_attachments
  FOR ALL USING (public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

DROP POLICY IF EXISTS "project_emails_read" ON public.project_emails;
DROP POLICY IF EXISTS "project_emails_write" ON public.project_emails;
CREATE POLICY "project_emails_read" ON public.project_emails
  FOR SELECT USING (
    public.is_admin_or_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.project_employees pe
      WHERE pe.project_id = project_emails.project_id
        AND pe.user_id = auth.uid()
    )
  );
CREATE POLICY "project_emails_write" ON public.project_emails
  FOR ALL USING (public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;
CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT USING (
    public.is_admin_or_super_admin(auth.uid())
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
  );
CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE USING (
    public.is_admin_or_super_admin(auth.uid())
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
  )
  WITH CHECK (
    public.is_admin_or_super_admin(auth.uid())
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
  );
CREATE POLICY "tasks_delete" ON public.tasks
  FOR DELETE USING (public.is_admin_or_super_admin(auth.uid()) OR created_by = auth.uid());

DROP POLICY IF EXISTS "comments_select" ON public.comments;
DROP POLICY IF EXISTS "comments_insert" ON public.comments;
DROP POLICY IF EXISTS "comments_update" ON public.comments;
DROP POLICY IF EXISTS "comments_delete" ON public.comments;
CREATE POLICY "comments_select" ON public.comments
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "comments_insert" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "comments_update" ON public.comments
  FOR UPDATE USING (author_id = auth.uid() OR public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (author_id = auth.uid() OR public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "comments_delete" ON public.comments
  FOR DELETE USING (author_id = auth.uid() OR public.is_admin_or_super_admin(auth.uid()));

DROP POLICY IF EXISTS "tags_select" ON public.tags;
DROP POLICY IF EXISTS "tags_manage" ON public.tags;
CREATE POLICY "tags_select" ON public.tags
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tags_manage" ON public.tags
  FOR ALL USING (public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

DROP POLICY IF EXISTS "tag_assignments_select" ON public.tag_assignments;
DROP POLICY IF EXISTS "tag_assignments_manage" ON public.tag_assignments;
CREATE POLICY "tag_assignments_select" ON public.tag_assignments
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tag_assignments_manage" ON public.tag_assignments
  FOR ALL USING (public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

DROP POLICY IF EXISTS "pipeline_stages_select" ON public.pipeline_stages;
DROP POLICY IF EXISTS "pipeline_stages_manage" ON public.pipeline_stages;
CREATE POLICY "pipeline_stages_select" ON public.pipeline_stages
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "pipeline_stages_manage" ON public.pipeline_stages
  FOR ALL USING (public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

DROP POLICY IF EXISTS "email_templates_select" ON public.email_templates;
DROP POLICY IF EXISTS "email_templates_manage" ON public.email_templates;
CREATE POLICY "email_templates_select" ON public.email_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "email_templates_manage" ON public.email_templates
  FOR ALL USING (public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

DROP POLICY IF EXISTS "custom_fields_select" ON public.custom_fields;
DROP POLICY IF EXISTS "custom_fields_manage" ON public.custom_fields;
CREATE POLICY "custom_fields_select" ON public.custom_fields
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "custom_fields_manage" ON public.custom_fields
  FOR ALL USING (public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

DROP POLICY IF EXISTS "custom_field_values_select" ON public.custom_field_values;
DROP POLICY IF EXISTS "custom_field_values_manage" ON public.custom_field_values;
CREATE POLICY "custom_field_values_select" ON public.custom_field_values
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "custom_field_values_manage" ON public.custom_field_values
  FOR ALL USING (public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

DROP POLICY IF EXISTS "saved_reports_select" ON public.saved_reports;
DROP POLICY IF EXISTS "saved_reports_insert" ON public.saved_reports;
DROP POLICY IF EXISTS "saved_reports_update" ON public.saved_reports;
DROP POLICY IF EXISTS "saved_reports_delete" ON public.saved_reports;
CREATE POLICY "saved_reports_select" ON public.saved_reports
  FOR SELECT USING (
    created_by = auth.uid()
    OR is_shared = true
    OR public.is_admin_or_super_admin(auth.uid())
  );
CREATE POLICY "saved_reports_insert" ON public.saved_reports
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "saved_reports_update" ON public.saved_reports
  FOR UPDATE USING (created_by = auth.uid() OR public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (created_by = auth.uid() OR public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "saved_reports_delete" ON public.saved_reports
  FOR DELETE USING (created_by = auth.uid() OR public.is_admin_or_super_admin(auth.uid()));

DROP POLICY IF EXISTS "module_read_auth" ON public.certifications;
DROP POLICY IF EXISTS "module_read_auth" ON public.memberships;
DROP POLICY IF EXISTS "module_read_auth" ON public.partnerships;
DROP POLICY IF EXISTS "module_read_auth" ON public.insurance;
DROP POLICY IF EXISTS "module_read_auth" ON public.vendors;
DROP POLICY IF EXISTS "module_read_auth" ON public.buyers;
DROP POLICY IF EXISTS "module_read_auth" ON public.crm_subscriptions;
DROP POLICY IF EXISTS "module_read_auth" ON public.documents;
DROP POLICY IF EXISTS "module_read_auth" ON public.alerts;

CREATE POLICY "module_read_auth" ON public.certifications FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "module_read_auth" ON public.memberships FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "module_read_auth" ON public.partnerships FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "module_read_auth" ON public.insurance FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "module_read_auth" ON public.vendors FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "module_read_auth" ON public.buyers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "module_read_auth" ON public.crm_subscriptions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "module_read_auth" ON public.documents FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "module_read_auth" ON public.alerts FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "module_write_admin" ON public.certifications;
DROP POLICY IF EXISTS "module_write_admin" ON public.memberships;
DROP POLICY IF EXISTS "module_write_admin" ON public.partnerships;
DROP POLICY IF EXISTS "module_write_admin" ON public.insurance;
DROP POLICY IF EXISTS "module_write_admin" ON public.vendors;
DROP POLICY IF EXISTS "module_write_admin" ON public.buyers;
DROP POLICY IF EXISTS "module_write_admin" ON public.crm_subscriptions;
DROP POLICY IF EXISTS "module_write_admin" ON public.documents;
DROP POLICY IF EXISTS "module_write_admin" ON public.alerts;

CREATE POLICY "module_write_admin" ON public.certifications FOR ALL USING (public.is_admin_or_super_admin(auth.uid())) WITH CHECK (public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "module_write_admin" ON public.memberships FOR ALL USING (public.is_admin_or_super_admin(auth.uid())) WITH CHECK (public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "module_write_admin" ON public.partnerships FOR ALL USING (public.is_admin_or_super_admin(auth.uid())) WITH CHECK (public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "module_write_admin" ON public.insurance FOR ALL USING (public.is_admin_or_super_admin(auth.uid())) WITH CHECK (public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "module_write_admin" ON public.vendors FOR ALL USING (public.is_admin_or_super_admin(auth.uid())) WITH CHECK (public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "module_write_admin" ON public.buyers FOR ALL USING (public.is_admin_or_super_admin(auth.uid())) WITH CHECK (public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "module_write_admin" ON public.crm_subscriptions FOR ALL USING (public.is_admin_or_super_admin(auth.uid())) WITH CHECK (public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "module_write_admin" ON public.documents FOR ALL USING (public.is_admin_or_super_admin(auth.uid())) WITH CHECK (public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "module_write_admin" ON public.alerts FOR ALL USING (public.is_admin_or_super_admin(auth.uid())) WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

DROP POLICY IF EXISTS "activity_logs_read" ON public.activity_logs;
DROP POLICY IF EXISTS "activity_logs_insert_admin" ON public.activity_logs;
CREATE POLICY "activity_logs_read" ON public.activity_logs
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "activity_logs_insert_admin" ON public.activity_logs
  FOR INSERT WITH CHECK (public.is_admin_or_super_admin(auth.uid()));

DROP POLICY IF EXISTS "admin_settings_select" ON public.admin_settings;
DROP POLICY IF EXISTS "admin_settings_insert" ON public.admin_settings;
DROP POLICY IF EXISTS "admin_settings_update" ON public.admin_settings;
CREATE POLICY "admin_settings_select" ON public.admin_settings
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "admin_settings_insert" ON public.admin_settings
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin_or_super_admin(auth.uid()));
CREATE POLICY "admin_settings_update" ON public.admin_settings
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin_or_super_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin_or_super_admin(auth.uid()));

COMMIT;

-- Optional: make your account super admin (run manually with your email)
-- UPDATE public.users SET role = 'super_admin' WHERE email = 'your-email@example.com';

