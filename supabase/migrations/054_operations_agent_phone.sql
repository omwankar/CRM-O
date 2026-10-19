-- Agent phone on the shared directory and on each inquiry send.

ALTER TABLE public.operations_agents
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.enquiry_agent_sends
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;
