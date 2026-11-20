-- Lead category (e.g. event lists) plus who contacted them and LinkedIn/website.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS contacted_by TEXT,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_company TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_person TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_category ON public.leads(category)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_contacted_by ON public.leads(contacted_by)
  WHERE deleted_at IS NULL;
