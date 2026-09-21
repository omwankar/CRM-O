-- 049_task_assignees.sql — allow a task to be assigned to several people at once.
-- assigned_person_id stays as the primary/first assignee for backward compatibility.

CREATE TABLE IF NOT EXISTS public.task_assignees (
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_task_assignees_user ON public.task_assignees(user_id);

INSERT INTO public.task_assignees (task_id, user_id)
SELECT id, assigned_person_id
FROM public.tasks
WHERE assigned_person_id IS NOT NULL
  AND deleted_at IS NULL
ON CONFLICT DO NOTHING;

ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS task_assignees_read_auth ON public.task_assignees;
CREATE POLICY task_assignees_read_auth ON public.task_assignees
  FOR SELECT TO authenticated USING (true);
