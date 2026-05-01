export interface PunchRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  type: 'missed_clock_in' | 'missed_clock_out' | 'full_day';
  requested_clock_in: string | null;
  requested_clock_out: string | null;
  actual_duration_minutes: number | null;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface PunchRequestStats {
  pending: number;
  approved_today: number;
  rejected_today: number;
}
