-- Align database schema with current app usage.
-- Run in Supabase SQL editor after existing schema scripts.

BEGIN;

-- ------------------------------------------------------------
-- users table
-- ------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT true;

-- ------------------------------------------------------------
-- certifications table (app uses credential_id, certificate_file)
-- ------------------------------------------------------------
-- Some projects created certifications without user_id; app inserts omit it.
ALTER TABLE public.certifications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.certifications
  ADD COLUMN IF NOT EXISTS credential_id TEXT,
  ADD COLUMN IF NOT EXISTS certificate_file TEXT;

-- Backfill from old columns if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'certifications' AND column_name = 'certificate_number'
  ) THEN
    UPDATE public.certifications
    SET credential_id = COALESCE(credential_id, certificate_number::text)
    WHERE credential_id IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'certifications' AND column_name = 'document_url'
  ) THEN
    UPDATE public.certifications
    SET certificate_file = COALESCE(certificate_file, document_url)
    WHERE certificate_file IS NULL;
  END IF;
END $$;

-- App inserts without user_id; default to current user when column is present (added above if missing)
ALTER TABLE public.certifications
  ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.certifications
  ALTER COLUMN user_id DROP NOT NULL;

-- ------------------------------------------------------------
-- memberships table (app uses membership_number, membership_fee)
-- ------------------------------------------------------------
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS membership_number TEXT,
  ADD COLUMN IF NOT EXISTS membership_fee NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS membership_level TEXT;

-- Compatibility with list pages that still read membership_id
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS membership_id TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'memberships' AND column_name = 'member_id'
  ) THEN
    UPDATE public.memberships
    SET membership_number = COALESCE(membership_number, member_id),
        membership_id = COALESCE(membership_id, member_id)
    WHERE membership_number IS NULL
       OR membership_id IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'memberships' AND column_name = 'membership_type'
  ) THEN
    UPDATE public.memberships
    SET membership_level = COALESCE(membership_level, membership_type)
    WHERE membership_level IS NULL;
  END IF;
END $$;

ALTER TABLE public.memberships
  ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.memberships
  ALTER COLUMN user_id DROP NOT NULL;

-- ------------------------------------------------------------
-- partnerships table (app uses partner_company_name, partnership_type)
-- ------------------------------------------------------------
ALTER TABLE public.partnerships
  ADD COLUMN IF NOT EXISTS partner_company_name TEXT,
  ADD COLUMN IF NOT EXISTS partner_name TEXT,
  ADD COLUMN IF NOT EXISTS partnership_type TEXT;

-- Backfill to keep old and new names in sync
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'partnerships' AND column_name = 'partner_name'
  ) THEN
    UPDATE public.partnerships
    SET partner_company_name = COALESCE(partner_company_name, partner_name)
    WHERE partner_company_name IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'partnerships' AND column_name = 'partner_type'
  ) THEN
    UPDATE public.partnerships
    SET partnership_type = COALESCE(partnership_type, partner_type)
    WHERE partnership_type IS NULL;
  END IF;
END $$;

-- ------------------------------------------------------------
-- insurance table (app uses provider, insurance_type, end_date, premium)
-- ------------------------------------------------------------
ALTER TABLE public.insurance
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS insurance_type TEXT,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS premium NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS agent_name TEXT,
  ADD COLUMN IF NOT EXISTS agent_phone TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'insurance' AND column_name = 'provider_name'
  ) THEN
    UPDATE public.insurance
    SET provider = COALESCE(provider, provider_name)
    WHERE provider IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'insurance' AND column_name = 'policy_type'
  ) THEN
    UPDATE public.insurance
    SET insurance_type = COALESCE(insurance_type, policy_type)
    WHERE insurance_type IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'insurance' AND column_name = 'expiry_date'
  ) THEN
    UPDATE public.insurance
    SET end_date = COALESCE(end_date, expiry_date)
    WHERE end_date IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'insurance' AND column_name = 'premium_amount'
  ) THEN
    UPDATE public.insurance
    SET premium = COALESCE(premium, premium_amount)
    WHERE premium IS NULL;
  END IF;
END $$;

-- ------------------------------------------------------------
-- vendors table (app uses category, email, phone, zip_code, etc.)
-- ------------------------------------------------------------
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS payment_terms TEXT,
  ADD COLUMN IF NOT EXISTS vendor_portal_link TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'contact_email'
  ) THEN
    UPDATE public.vendors
    SET email = COALESCE(email, contact_email)
    WHERE email IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'contact_phone'
  ) THEN
    UPDATE public.vendors
    SET phone = COALESCE(phone, contact_phone)
    WHERE phone IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'postal_code'
  ) THEN
    UPDATE public.vendors
    SET zip_code = COALESCE(zip_code, postal_code)
    WHERE zip_code IS NULL;
  END IF;
END $$;

-- ------------------------------------------------------------
-- buyers table (app uses email, phone, zip_code, credit_limit, portal)
-- ------------------------------------------------------------
ALTER TABLE public.buyers
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS buyer_portal_link TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'buyers' AND column_name = 'contact_email'
  ) THEN
    UPDATE public.buyers
    SET email = COALESCE(email, contact_email)
    WHERE email IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'buyers' AND column_name = 'contact_phone'
  ) THEN
    UPDATE public.buyers
    SET phone = COALESCE(phone, contact_phone)
    WHERE phone IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'buyers' AND column_name = 'postal_code'
  ) THEN
    UPDATE public.buyers
    SET zip_code = COALESCE(zip_code, postal_code)
    WHERE zip_code IS NULL;
  END IF;
END $$;

-- ------------------------------------------------------------
-- documents table (app uses module/record_id/file_name/file_url/file_path)
-- ------------------------------------------------------------
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS module TEXT,
  ADD COLUMN IF NOT EXISTS record_id UUID,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Allow app insert shape (it doesn't send related_table/related_id/document_name)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'related_table'
  ) THEN
    ALTER TABLE public.documents ALTER COLUMN related_table DROP NOT NULL;
    UPDATE public.documents
    SET module = COALESCE(module, related_table)
    WHERE module IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'related_id'
  ) THEN
    ALTER TABLE public.documents ALTER COLUMN related_id DROP NOT NULL;
    UPDATE public.documents
    SET record_id = COALESCE(record_id, related_id)
    WHERE record_id IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'document_name'
  ) THEN
    ALTER TABLE public.documents ALTER COLUMN document_name DROP NOT NULL;
    UPDATE public.documents
    SET file_name = COALESCE(file_name, document_name)
    WHERE file_name IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'file_url'
  ) THEN
    UPDATE public.documents
    SET file_path = COALESCE(file_path, file_url)
    WHERE file_path IS NULL;
  END IF;
END $$;

-- App sends free-text document_type from input fields
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'documents'
      AND column_name = 'document_type'
      AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE public.documents
      ALTER COLUMN document_type TYPE TEXT USING document_type::text;
  END IF;
END $$;

-- ------------------------------------------------------------
-- admin_settings table (app stores per-user config row)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS cert_expiry_days INT DEFAULT 30,
  ADD COLUMN IF NOT EXISTS membership_expiry_days INT DEFAULT 30,
  ADD COLUMN IF NOT EXISTS insurance_expiry_days INT DEFAULT 30,
  ADD COLUMN IF NOT EXISTS alert_email TEXT,
  ADD COLUMN IF NOT EXISTS enable_email_alerts BOOLEAN DEFAULT true;

-- App uses upsert on user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_settings_user_id
  ON public.admin_settings(user_id);

-- Replace old admin_settings policies with per-user policies
DROP POLICY IF EXISTS "Admins can view settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Only super admin can update settings" ON public.admin_settings;

CREATE POLICY "Users can view own settings"
  ON public.admin_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.admin_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.admin_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMIT;

