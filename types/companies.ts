export type CompanyType = 'customer' | 'vendor' | 'partner' | 'prospect';

export const COMPANY_TYPES_ORDER: CompanyType[] = [
  'customer',
  'vendor',
  'partner',
  'prospect',
];

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  customer: 'Customer',
  vendor: 'Vendor',
  partner: 'Partner',
  prospect: 'Prospect',
};

export const COMPANY_TYPE_BADGE: Record<CompanyType, string> = {
  customer: 'border border-emerald-500/35 bg-emerald-500/12 text-emerald-900 dark:text-emerald-200',
  vendor: 'border border-blue-500/35 bg-blue-500/12 text-blue-900 dark:text-blue-200',
  partner: 'border border-violet-500/35 bg-violet-500/12 text-violet-900 dark:text-violet-200',
  prospect: 'border border-amber-500/35 bg-amber-500/12 text-amber-900 dark:text-amber-200',
};

export interface Company {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  industry: string | null;
  website: string | null;
  company_types: CompanyType[];
  notes: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
  buyers?: Array<{ id: string; buyer_name: string; contact_email?: string | null; industry?: string | null; created_at: string }>;
  vendors?: Array<{ id: string; vendor_name: string; contact_email?: string | null; vendor_type?: string | null; created_at: string }>;
  partnerships?: Array<{
    id: string;
    partner_name: string;
    partner_company_name?: string | null;
    partner_type?: string | null;
    partnership_type?: string | null;
    created_at: string;
  }>;
  also_buyer?: boolean;
  also_vendor?: boolean;
  also_partner?: boolean;
}

export interface CompanyInput {
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  industry?: string | null;
  website?: string | null;
  company_types?: CompanyType[];
  notes?: string | null;
}
