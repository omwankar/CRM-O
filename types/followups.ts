export type FollowUpEntityType =
  | 'lead'
  | 'enquiry'
  | 'quotation'
  | 'buyer'
  | 'opportunity'
  | 'email'
  | 'call'
  | 'other';

export type FollowUpType = 'email' | 'call' | 'quotation' | 'meeting' | 'other';

export type FollowUpEmailStatus =
  | 'email_sent'
  | 'reply_received'
  | 'follow_up_pending'
  | 'follow_up_completed';

export type FollowUpStatus = 'pending' | 'completed' | 'cancelled';

export type FollowUpBucket = 'overdue' | 'today' | 'soon' | 'pending' | 'completed' | 'all';

export interface FollowUp {
  id: string;
  title: string;
  description: string | null;
  entity_type: FollowUpEntityType;
  entity_id: string | null;
  entity_label: string | null;
  follow_up_type: FollowUpType;
  email_status: FollowUpEmailStatus | null;
  due_at: string;
  status: FollowUpStatus;
  assigned_to: string | null;
  created_by: string | null;
  completed_at: string | null;
  completed_by: string | null;
  watchers: string[];
  escalation_level: number;
  last_escalated_at: string | null;
  created_at: string;
  updated_at: string;
  // enriched by the API
  assigned_to_name?: string | null;
  created_by_name?: string | null;
  completed_by_name?: string | null;
  watcher_names?: string[];
  overdue_days?: number;
}

export interface FollowUpInput {
  title: string;
  description?: string | null;
  entity_type?: FollowUpEntityType;
  entity_id?: string | null;
  entity_label?: string | null;
  follow_up_type?: FollowUpType;
  email_status?: FollowUpEmailStatus | null;
  due_at: string;
  assigned_to?: string | null;
  watchers?: string[];
}

export interface FollowUpEvent {
  id: string;
  follow_up_id: string;
  actor_id: string | null;
  actor_name?: string | null;
  action: string;
  detail: string | null;
  created_at: string;
}

export interface FollowUpSummary {
  overdue: number;
  due_today: number;
  due_soon: number;
  upcoming: number;
  completed_this_month: number;
  scope: 'mine' | 'all';
}

export const EMAIL_STATUS_LABELS: Record<FollowUpEmailStatus, string> = {
  email_sent: 'Email sent',
  reply_received: 'Reply received',
  follow_up_pending: 'Follow-up pending',
  follow_up_completed: 'Follow-up completed',
};

export const FOLLOW_UP_TYPE_LABELS: Record<FollowUpType, string> = {
  email: 'Email',
  call: 'Call',
  quotation: 'Quotation',
  meeting: 'Meeting',
  other: 'Other',
};

export const ENTITY_TYPE_LABELS: Record<FollowUpEntityType, string> = {
  lead: 'Lead',
  enquiry: 'Enquiry',
  quotation: 'Quotation',
  buyer: 'Buyer / Customer',
  opportunity: 'Opportunity',
  email: 'Email',
  call: 'Call',
  other: 'Other',
};

/** Which colored bucket a follow-up belongs to right now. */
export function followUpBucket(f: Pick<FollowUp, 'status' | 'due_at'>): 'overdue' | 'today' | 'soon' | 'upcoming' | 'completed' | 'cancelled' {
  if (f.status === 'completed') return 'completed';
  if (f.status === 'cancelled') return 'cancelled';
  const due = new Date(f.due_at).getTime();
  const now = Date.now();
  if (due < now) return 'overdue';
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const DAY = 24 * 60 * 60 * 1000;
  if (due < startOfToday.getTime() + DAY) return 'today';
  if (due < startOfToday.getTime() + 4 * DAY) return 'soon';
  return 'upcoming';
}

export const BUCKET_STYLES: Record<ReturnType<typeof followUpBucket>, { label: string; badge: string; border: string }> = {
  overdue: {
    label: 'Overdue',
    badge: 'bg-red-100 text-red-700 border border-red-300',
    border: 'border-l-4 border-l-red-500',
  },
  today: {
    label: 'Due today',
    badge: 'bg-orange-100 text-orange-700 border border-orange-300',
    border: 'border-l-4 border-l-orange-500',
  },
  soon: {
    label: 'Due soon',
    badge: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    border: 'border-l-4 border-l-yellow-400',
  },
  upcoming: {
    label: 'Upcoming',
    badge: 'bg-blue-100 text-blue-700 border border-blue-200',
    border: 'border-l-4 border-l-blue-300',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-emerald-100 text-emerald-700 border border-emerald-300',
    border: 'border-l-4 border-l-emerald-500',
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-slate-100 text-slate-600 border border-slate-300',
    border: 'border-l-4 border-l-slate-300',
  },
};
