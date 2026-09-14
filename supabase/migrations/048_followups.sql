-- 048_followups.sql — Follow-Up & Accountability System
-- Follow-ups can be attached to any CRM record (lead, enquiry, quotation,
-- buyer, opportunity, email, call) and carry their own assignee, watchers,
-- due date/time, escalation level and a full audit history.

CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  -- What this follow-up is about
  entity_type TEXT NOT NULL DEFAULT 'other'
    CHECK (entity_type IN ('lead', 'enquiry', 'quotation', 'buyer', 'opportunity', 'email', 'call', 'other')),
  entity_id UUID,
  entity_label TEXT, -- human-readable reference, e.g. "ENQ-2026-014 — UK to Aqaba"
  follow_up_type TEXT NOT NULL DEFAULT 'other'
    CHECK (follow_up_type IN ('email', 'call', 'quotation', 'meeting', 'other')),
  -- Email follow-ups track the conversation state separately from completion:
  -- sending an email must NOT auto-complete the follow-up.
  email_status TEXT
    CHECK (email_status IN ('email_sent', 'reply_received', 'follow_up_pending', 'follow_up_completed')),
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'cancelled')),
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  watchers UUID[] NOT NULL DEFAULT '{}',
  -- Escalation: 0 = none, 1 = 2-day reminder sent, 2 = 5-day super-admin alert sent
  escalation_level INT NOT NULL DEFAULT 0,
  last_escalated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_assigned ON public.follow_ups(assigned_to);
CREATE INDEX IF NOT EXISTS idx_follow_ups_created_by ON public.follow_ups(created_by);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status_due ON public.follow_ups(status, due_at);
CREATE INDEX IF NOT EXISTS idx_follow_ups_entity ON public.follow_ups(entity_type, entity_id);

-- Full audit history: who created, assigned, rescheduled, completed, escalated…
CREATE TABLE IF NOT EXISTS public.follow_up_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follow_up_id UUID NOT NULL REFERENCES public.follow_ups(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- created / assigned / rescheduled / completed / reopened / cancelled / email_status / watchers / escalated / updated
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follow_up_events_follow_up ON public.follow_up_events(follow_up_id, created_at);

-- RLS: backend uses the service role; block direct anon/client access
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS follow_ups_read_auth ON public.follow_ups;
CREATE POLICY follow_ups_read_auth ON public.follow_ups
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS follow_up_events_read_auth ON public.follow_up_events;
CREATE POLICY follow_up_events_read_auth ON public.follow_up_events
  FOR SELECT TO authenticated USING (true);
