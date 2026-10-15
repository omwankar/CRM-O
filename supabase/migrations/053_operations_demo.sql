-- Operations demo: shared agent directory, contacts on each send, and inquiry updates.

CREATE TABLE IF NOT EXISTS public.operations_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS operations_agents_company_lower
  ON public.operations_agents (lower(btrim(company_name)));

ALTER TABLE public.enquiry_agent_sends
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS quoted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS chosen_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.enquiry_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enquiry_updates_enquiry ON public.enquiry_updates(enquiry_id, created_at DESC);

ALTER TABLE public.operations_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiry_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operations_agents_auth ON public.operations_agents;
CREATE POLICY operations_agents_auth ON public.operations_agents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS enquiry_updates_auth ON public.enquiry_updates;
CREATE POLICY enquiry_updates_auth ON public.enquiry_updates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
