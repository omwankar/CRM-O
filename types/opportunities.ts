export type OpportunityStage =
  | 'lead'
  | 'contacted'
  | 'proposal_sent'
  | 'negotiating'
  | 'closed_won'
  | 'closed_lost';

export const OPPORTUNITY_STAGES_ORDER: OpportunityStage[] = [
  'lead',
  'contacted',
  'proposal_sent',
  'negotiating',
  'closed_won',
  'closed_lost',
];

export const OPPORTUNITY_STAGE_LABELS: Record<OpportunityStage, string> = {
  lead: 'Lead',
  contacted: 'Contacted',
  proposal_sent: 'Proposal Sent',
  negotiating: 'Negotiating',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

export const OPPORTUNITY_STAGE_BADGE: Record<OpportunityStage, string> = {
  lead: 'border border-blue-500/35 bg-blue-500/12 text-blue-800 dark:text-blue-200',
  contacted: 'border border-amber-500/35 bg-amber-500/12 text-amber-900 dark:text-amber-200',
  proposal_sent: 'border border-violet-500/35 bg-violet-500/12 text-violet-900 dark:text-violet-200',
  negotiating: 'border border-orange-500/35 bg-orange-500/12 text-orange-900 dark:text-orange-200',
  closed_won: 'border border-emerald-500/35 bg-emerald-500/12 text-emerald-900 dark:text-emerald-200',
  closed_lost: 'border border-red-500/35 bg-red-500/12 text-red-900 dark:text-red-200',
};

export const OPEN_OPPORTUNITY_STAGES: OpportunityStage[] = [
  'lead',
  'contacted',
  'proposal_sent',
  'negotiating',
];

export interface Opportunity {
  id: string;
  buyer_id: string;
  title: string;
  stage: OpportunityStage;
  value: number | null;
  currency: string | null;
  expected_close_date: string | null;
  owner_id: string | null;
  enquiry_id: string | null;
  notes: string | null;
  lead_id: string | null;
  created_by: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
  buyer?: { id: string; buyer_name: string; contact_email?: string } | null;
  owner?: { id: string; full_name: string } | null;
  enquiries?: Array<{ id: string; enquiry_number: string; title: string | null; stage: string; created_at: string }>;
  quotations?: Array<{ id: string; quotation_number: string; status: string; created_at: string }>;
  last_activity_at?: string | null;
  days_since_last_activity?: number | null;
}

export interface OpportunityInput {
  buyer_id: string;
  title: string;
  stage?: OpportunityStage;
  value?: number | null;
  currency?: string | null;
  expected_close_date?: string | null;
  owner_id?: string | null;
  enquiry_id?: string | null;
  notes?: string | null;
  lead_id?: string | null;
}
