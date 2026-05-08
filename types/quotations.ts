export type QuotationStatus =
  | 'quote_given'
  | 'waiting_from_companies'
  | 'need_revision'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  quote_given: 'Quote Given',
  waiting_from_companies: 'Waiting from Companies',
  need_revision: 'Need Revision',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const QUOTATION_STATUS_COLORS: Record<QuotationStatus, string> = {
  quote_given: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  waiting_from_companies: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  need_revision: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-300',
};

export interface VendorQuote {
  id: string;
  quotation_id: string;
  vendor_id?: string | null;
  vendor_name?: string | null;
  email_sent_to?: string | null;
  email_sent_at?: string | null;
  email_thread_id?: string | null;
  quoted_price?: number | null;
  currency: string;
  quote_received_at?: string | null;
  notes?: string | null;
  is_chosen: boolean;
  created_at: string;
  vendors?: { id: string; vendor_name: string };
}

export interface QuotationRevision {
  id: string;
  quotation_id: string;
  revision_number: number;
  revised_price?: number | null;
  currency: string;
  notes?: string | null;
  revised_by?: string | null;
  created_at: string;
  users?: { full_name: string };
}

export interface Quotation {
  id: string;
  quotation_number: string;
  status: QuotationStatus;
  requirement: string;
  enquiry_lead?: string | null;
  project_id?: string | null;
  standalone_project_name?: string | null;
  client_budget?: number | null;
  client_currency: string;
  client_price_notes?: string | null;
  deadline?: string | null;
  chosen_quote_id?: string | null;
  clarusto_final_price?: number | null;
  clarusto_final_currency: string;
  clarusto_final_notes?: string | null;
  clarusto_quote_sent_at?: string | null;
  revised_price?: number | null;
  revised_currency: string;
  revised_notes?: string | null;
  revised_at?: string | null;
  revised_by?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  users?: { id: string; full_name: string | null; avatar_url?: string | null };
  projects?: { id: string; project_name: string };
  quotation_vendor_quotes?: VendorQuote[];
  quotation_revisions?: QuotationRevision[];
}

export interface CreateQuotationInput {
  requirement: string;
  status: QuotationStatus;
  enquiry_lead?: string;
  project_id?: string;
  standalone_project_name?: string;
  client_budget?: number;
  client_currency?: string;
  client_price_notes?: string;
  deadline?: string;
}

export interface UpdateQuotationInput extends Partial<CreateQuotationInput> {
  chosen_quote_id?: string;
  clarusto_final_price?: number;
  clarusto_final_currency?: string;
  clarusto_final_notes?: string;
  clarusto_quote_sent_at?: string;
  revised_price?: number;
  revised_currency?: string;
  revised_notes?: string;
}

