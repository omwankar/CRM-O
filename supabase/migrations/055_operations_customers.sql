-- Operations customers directory, and mark which enquiries belong on the pipeline.

CREATE TABLE IF NOT EXISTS public.operations_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS operations_customers_company_lower
  ON public.operations_customers (lower(btrim(company_name)));

ALTER TABLE public.operations_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operations_customers_auth ON public.operations_customers;
CREATE POLICY operations_customers_auth ON public.operations_customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.enquiries
  ADD COLUMN IF NOT EXISTS in_operations BOOLEAN NOT NULL DEFAULT false;

UPDATE public.enquiries
SET in_operations = true
WHERE id IN (SELECT enquiry_id FROM public.enquiry_operators);
