-- ============================================================================
-- 044: Ensure partnerships.terms_url (and related optional cols) exist
-- ============================================================================
-- App create/edit partner forms send terms_url; older DBs may lack it,
-- which surfaces as: Could not find the 'terms_url' column ... schema cache

ALTER TABLE public.partnerships
  ADD COLUMN IF NOT EXISTS terms_url TEXT;

ALTER TABLE public.partnerships
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.partnerships
  ADD COLUMN IF NOT EXISTS partner_company_name TEXT;

ALTER TABLE public.partnerships
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Refresh PostgREST schema cache so new columns are visible immediately
NOTIFY pgrst, 'reload schema';
