export type QuotationStatus =
  | 'quote_given'
  | 'waiting_from_companies'
  | 'need_revision'
  | 'approved'
  | 'rejected'
  | 'cancelled';

/** Enquiry tracker stepper stages (DB: quotations.enquiry_stage) */
export type EnquiryStage =
  | 'new_enquiry'
  | 'under_review'
  | 'preparing'
  | 'quote_sent'
  | 'follow_up'
  | 'won_lost_closed';

export const ENQUIRY_STAGE_LABELS: Record<EnquiryStage, string> = {
  new_enquiry: 'New Enquiry',
  under_review: 'Under Review',
  preparing: 'Preparing',
  quote_sent: 'Quote Sent',
  follow_up: 'Follow-up',
  won_lost_closed: 'Won / Lost / Closed',
};

export const ENQUIRY_STAGES_ORDER: EnquiryStage[] = [
  'new_enquiry',
  'under_review',
  'preparing',
  'quote_sent',
  'follow_up',
  'won_lost_closed',
];

/** Badge colors aligned with the detail stepper / tracker UX */
export const ENQUIRY_STAGE_BADGE_CLASSES: Record<EnquiryStage, string> = {
  new_enquiry: 'border border-blue-500/35 bg-blue-500/12 text-blue-800 dark:text-blue-200',
  under_review: 'border border-amber-500/35 bg-amber-500/12 text-amber-900 dark:text-amber-200',
  preparing: 'border border-violet-500/35 bg-violet-500/12 text-violet-900 dark:text-violet-200',
  quote_sent: 'border border-sky-500/35 bg-sky-500/12 text-sky-900 dark:text-sky-200',
  follow_up: 'border border-slate-500/35 bg-slate-500/12 text-slate-800 dark:text-slate-200',
  won_lost_closed: 'border border-emerald-500/35 bg-emerald-500/12 text-emerald-900 dark:text-emerald-200',
};

export const PRIORITY_BADGE_CLASSES: Record<'low' | 'medium' | 'high', string> = {
  low: 'border border-zinc-400/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300',
  medium: 'border border-amber-500/40 bg-amber-500/12 text-amber-900 dark:text-amber-200',
  high: 'border border-red-500/40 bg-red-500/12 text-red-800 dark:text-red-200',
};

export function normalizeEnquiryStage(q: { enquiry_stage?: EnquiryStage | null } | null | undefined): EnquiryStage {
  const s = q?.enquiry_stage;
  if (s && ENQUIRY_STAGES_ORDER.includes(s)) return s;
  return 'new_enquiry';
}

/** How the enquiry ended once it reaches Won / Lost / Closed */
export type ClosureKind = 'won' | 'lost' | 'closed';

export const CLOSURE_KIND_LABELS: Record<ClosureKind, string> = {
  won: 'Won',
  lost: 'Lost',
  closed: 'Closed',
};

export const CLOSURE_KIND_BADGE_CLASSES: Record<ClosureKind, string> = {
  won: 'border border-emerald-500/45 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200',
  lost: 'border border-red-500/45 bg-red-500/15 text-red-900 dark:text-red-200',
  closed: 'border border-slate-500/45 bg-slate-500/15 text-slate-900 dark:text-slate-200',
};

export function parseClosureKindFromOutcome(outcome: string | null | undefined): ClosureKind | null {
  const s = (outcome || '').trim().toLowerCase();
  if (s.startsWith('won')) return 'won';
  if (s.startsWith('lost')) return 'lost';
  if (s.startsWith('closed')) return 'closed';
  return null;
}

export function closureKindToCrmStatus(kind: ClosureKind): QuotationStatus {
  if (kind === 'won') return 'approved';
  if (kind === 'lost') return 'rejected';
  return 'cancelled';
}

export function buildOutcomeString(kind: ClosureKind, detail?: string): string {
  const base = CLOSURE_KIND_LABELS[kind];
  const d = (detail || '').trim();
  return d ? `${base} — ${d}` : base;
}

export type FollowupMethod = 'Call' | 'Email' | 'Meeting';
export type ReminderStatus = 'completed' | 'pending' | 'not_set';
export type VendorQuoteLineStatus = 'under_review' | 'sent' | 'finalised';

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
  vendor_quote_number?: string | null;
  validity_date?: string | null;
  quote_file_url?: string | null;
  quote_line_status?: VendorQuoteLineStatus | null;
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

export interface QuotationFollowup {
  id: string;
  quotation_id: string;
  followup_date: string;
  method: FollowupMethod;
  customer_response?: string | null;
  next_followup_date?: string | null;
  reminder_status: ReminderStatus;
  created_by?: string | null;
  created_at: string;
  users?: { id: string; full_name: string | null } | null;
}

export interface CreateFollowupInput {
  followup_date: string;
  method: FollowupMethod;
  customer_response?: string;
  next_followup_date?: string;
  reminder_status?: ReminderStatus;
}

export interface UpdateFollowupInput extends Partial<CreateFollowupInput> {}

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
  enquiry_title?: string | null;
  enquiry_stage?: EnquiryStage | null;
  priority?: 'low' | 'medium' | 'high' | null;
  outcome?: string | null;
  tracker_remarks?: string | null;
  updated_by?: string | null;
  // Joined
  users?: { id: string; full_name: string | null; avatar_url?: string | null; email?: string | null; phone?: string | null };
  projects?: { id: string; project_name: string };
  quotation_vendor_quotes?: VendorQuote[];
  quotation_revisions?: QuotationRevision[];
  quotation_followups?: QuotationFollowup[];
  updated_by_user?: { id: string; full_name: string | null; email?: string | null } | null;
}

export interface CreateQuotationInput {
  requirement: string;
  status: QuotationStatus;
  enquiry_lead?: string | null;
  project_id?: string;
  standalone_project_name?: string;
  client_budget?: number;
  client_currency?: string;
  client_price_notes?: string;
  deadline?: string;
  enquiry_title?: string;
  enquiry_stage?: EnquiryStage;
  priority?: 'low' | 'medium' | 'high';
  outcome?: string;
  tracker_remarks?: string;
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
