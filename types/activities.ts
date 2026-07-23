export type ActivityType = 'call' | 'email' | 'meeting' | 'note';

export type ActivityEntityType =
  | 'lead'
  | 'opportunity'
  | 'enquiry'
  | 'quotation'
  | 'buyer'
  | 'vendor'
  | 'contact'
  | 'company'
  | 'job'
  | 'project'
  | 'partnership';

export type ActivityOutcome =
  | 'connected'
  | 'no_answer'
  | 'voicemail'
  | 'completed'
  | 'cancelled'
  | 'other';

export const ACTIVITY_TYPES_ORDER: ActivityType[] = ['call', 'email', 'meeting', 'note'];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  note: 'Note',
};

export const ACTIVITY_OUTCOME_LABELS: Record<ActivityOutcome, string> = {
  connected: 'Connected',
  no_answer: 'No answer',
  voicemail: 'Voicemail',
  completed: 'Completed',
  cancelled: 'Cancelled',
  other: 'Other',
};

export const CALL_OUTCOMES: ActivityOutcome[] = ['connected', 'no_answer', 'voicemail', 'other'];

export interface Activity {
  id: string;
  type: ActivityType;
  entity_type: ActivityEntityType;
  entity_id: string;
  subject: string;
  notes: string | null;
  activity_date: string;
  outcome: ActivityOutcome | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator?: { id: string; full_name: string } | null;
}

export interface ActivityInput {
  type: ActivityType;
  entity_type: ActivityEntityType;
  entity_id: string;
  subject: string;
  notes?: string | null;
  activity_date?: string | null;
  outcome?: ActivityOutcome | null;
}
