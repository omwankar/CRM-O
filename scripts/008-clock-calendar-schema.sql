-- Clock In/Out + Calendar + Missed Punch + Notifications
-- Run in Supabase SQL Editor.

BEGIN;

-- ------------------------------------------------------------
-- clock_sessions
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

-- ------------------------------------------------------------
-- missed_punch_requests
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.missed_punch_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'clock_in' | 'clock_out'
  requested_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- calendar_events
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'holiday', -- holiday | meeting
  start_time TIME,
  end_time TIME,
  description TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- notifications
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.clock_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missed_punch_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- RLS: clock_sessions (user can manage own sessions)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "clock_sessions_select_own" ON public.clock_sessions;
DROP POLICY IF EXISTS "clock_sessions_insert_own" ON public.clock_sessions;
DROP POLICY IF EXISTS "clock_sessions_update_own" ON public.clock_sessions;

CREATE POLICY "clock_sessions_select_own"
  ON public.clock_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "clock_sessions_insert_own"
  ON public.clock_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clock_sessions_update_own"
  ON public.clock_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- RLS: missed_punch_requests
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "missed_punch_select_own" ON public.missed_punch_requests;
DROP POLICY IF EXISTS "missed_punch_insert_own" ON public.missed_punch_requests;
DROP POLICY IF EXISTS "missed_punch_select_heads" ON public.missed_punch_requests;

CREATE POLICY "missed_punch_select_own"
  ON public.missed_punch_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "missed_punch_select_heads"
  ON public.missed_punch_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "missed_punch_insert_own"
  ON public.missed_punch_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow heads to update status (optional for now)
DROP POLICY IF EXISTS "missed_punch_update_heads" ON public.missed_punch_requests;
CREATE POLICY "missed_punch_update_heads"
  ON public.missed_punch_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('super_admin', 'admin')
    )
  );

-- ------------------------------------------------------------
-- RLS: calendar_events (authenticated can read, heads can insert)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "calendar_events_select_auth" ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_events_insert_heads" ON public.calendar_events;

CREATE POLICY "calendar_events_select_auth"
  ON public.calendar_events
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "calendar_events_insert_heads"
  ON public.calendar_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('super_admin', 'admin')
    )
    AND created_by = auth.uid()
  );

-- ------------------------------------------------------------
-- RLS: notifications (user can read own; inserts are usually done via service role)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_self" ON public.notifications;

CREATE POLICY "notifications_select_own"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_self"
  ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMIT;

