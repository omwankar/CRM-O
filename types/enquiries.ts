/** Enquiry stages — owned by the Enquiries module (not Quotations). */
export type EnquiryStage =
  | 'new_enquiry'
  | 'under_review'
  | 'preparing'
  | 'quote_sent'
  | 'follow_up'
  | 'won_closed'
  | 'lost_closed';

export const ENQUIRY_STAGE_LABELS: Record<EnquiryStage, string> = {
  new_enquiry: 'New Enquiry',
  under_review: 'Under Review',
  preparing: 'Preparing',
  quote_sent: 'Quote Sent',
  follow_up: 'Follow-up',
  won_closed: 'Won & Closed',
  lost_closed: 'Lost & Closed',
};

export const ENQUIRY_STAGES_ORDER: EnquiryStage[] = [
  'new_enquiry',
  'under_review',
  'preparing',
  'quote_sent',
  'follow_up',
  'won_closed',
  'lost_closed',
];

export const ENQUIRY_STAGE_BADGE_CLASSES: Record<EnquiryStage, string> = {
  new_enquiry: 'border border-blue-500/35 bg-blue-500/12 text-blue-800 dark:text-blue-200',
  under_review: 'border border-amber-500/35 bg-amber-500/12 text-amber-900 dark:text-amber-200',
  preparing: 'border border-violet-500/35 bg-violet-500/12 text-violet-900 dark:text-violet-200',
  quote_sent: 'border border-sky-500/35 bg-sky-500/12 text-sky-900 dark:text-sky-200',
  follow_up: 'border border-slate-500/35 bg-slate-500/12 text-slate-800 dark:text-slate-200',
  won_closed: 'border border-emerald-500/35 bg-emerald-500/12 text-emerald-900 dark:text-emerald-200',
  lost_closed: 'border border-red-500/35 bg-red-500/12 text-red-900 dark:text-red-200',
};

export const ENQUIRY_CURRENCIES = ['INR', 'USD', 'EUR', 'AED', 'GBP'] as const;

export interface Enquiry {
  id: string;
  enquiry_number: string;
  title: string | null;
  requirement: string;
  project_id: string | null;
  standalone_project_name: string | null;
  owner_id: string | null;
  buyer_id: string | null;
  client_email: string | null;
  prospect_name: string | null;
  client_budget: number | null;
  client_currency: string | null;
  client_price_notes: string | null;
  deadline: string | null;
  priority: 'low' | 'medium' | 'high';
  stage: EnquiryStage;
  notes: string | null;
  outcome: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  owner?: { id: string; full_name: string; email?: string } | null;
  creator?: { id: string; full_name: string } | null;
  buyer?: { id: string; buyer_name: string; contact_email?: string } | null;
  project?: { id: string; project_id?: string; project_name?: string } | null;
  quotations?: Array<{
    id: string;
    quotation_number: string;
    status: string;
    quote_sent_at?: string | null;
    created_at: string;
    clarusto_final_price?: number | null;
    revised_price?: number | null;
  }>;
}

export interface EnquiryInput {
  title?: string | null;
  requirement: string;
  project_id?: string | null;
  standalone_project_name?: string | null;
  owner_id?: string | null;
  buyer_id?: string | null;
  opportunity_id?: string | null;
  client_email?: string | null;
  prospect_name?: string | null;
  client_budget?: number | null;
  client_currency?: string | null;
  client_price_notes?: string | null;
  deadline?: string | null;
  priority?: 'low' | 'medium' | 'high';
  stage?: EnquiryStage;
  notes?: string | null;
  outcome?: string | null;
}

export function isTerminalEnquiryStage(stage: EnquiryStage): boolean {
  return stage === 'won_closed' || stage === 'lost_closed';
}
