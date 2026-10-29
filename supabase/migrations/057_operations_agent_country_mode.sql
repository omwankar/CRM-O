-- Country and transport mode on the agent directory and on each inquiry send.

ALTER TABLE public.operations_agents
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS mode TEXT;

ALTER TABLE public.enquiry_agent_sends
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS mode TEXT;
