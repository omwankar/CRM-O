-- Allow several contact people at the same agent company.

DROP INDEX IF EXISTS public.operations_agents_company_lower;

CREATE UNIQUE INDEX IF NOT EXISTS operations_agents_company_contact_lower
  ON public.operations_agents (
    lower(btrim(company_name)),
    lower(btrim(coalesce(contact_name, '')))
  );
