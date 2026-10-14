-- Operations pipeline: several people can work one enquiry and log the agents they sent.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS in_operations BOOLEAN NOT NULL DEFAULT false;

UPDATE public.users
SET in_operations = true
WHERE full_name ILIKE '%padma%'
   OR full_name ILIKE '%vikram%'
   OR full_name ILIKE '%amal%';

CREATE TABLE IF NOT EXISTS public.enquiry_operators (
  enquiry_id UUID NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'working' CHECK (status IN ('working', 'quoted')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (enquiry_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_enquiry_operators_user ON public.enquiry_operators(user_id);

CREATE TABLE IF NOT EXISTS public.enquiry_agent_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vendor_id UUID,
  agent_name TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quoted_price NUMERIC(15, 2),
  currency TEXT,
  notes TEXT,
  is_best BOOLEAN NOT NULL DEFAULT false,
  vendor_quote_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enquiry_agent_sends_enquiry ON public.enquiry_agent_sends(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_enquiry_agent_sends_user ON public.enquiry_agent_sends(user_id);

ALTER TABLE public.quotation_vendor_quotes
  ADD COLUMN IF NOT EXISTS logged_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.enquiry_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiry_agent_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS enquiry_operators_auth ON public.enquiry_operators;
CREATE POLICY enquiry_operators_auth ON public.enquiry_operators
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS enquiry_agent_sends_auth ON public.enquiry_agent_sends;
CREATE POLICY enquiry_agent_sends_auth ON public.enquiry_agent_sends
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
