-- ============================================================================
-- 045: Ensure projects has assignee / supervisor columns
-- ============================================================================
-- Create-project API sends assigned_person_id and supervisor_id; older DBs
-- may only have contact_person from the original schema.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS assigned_person_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_assigned_person ON public.projects(assigned_person_id);
CREATE INDEX IF NOT EXISTS idx_projects_supervisor ON public.projects(supervisor_id);

NOTIFY pgrst, 'reload schema';
