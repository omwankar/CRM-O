import { apiRequest } from '@/lib/api/client';

export type ClockSession = {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  notes: string | null;
};

export async function getHrAttendance(params?: { user_id?: string; month?: string }) {
  const q = new URLSearchParams();
  if (params?.user_id) q.set('user_id', params.user_id);
  if (params?.month) q.set('month', params.month);
  const query = q.toString();
  return apiRequest(`/hr/attendance${query ? `?${query}` : ''}`) as Promise<{
    sessions: ClockSession[];
    totalHours: number;
    month: string;
  }>;
}

export async function getHrAttendanceSummary(month?: string) {
  const q = month ? `?month=${month}` : '';
  return apiRequest(`/hr/attendance/summary${q}`) as Promise<{
    month: string;
    data: Array<{
      user_id: string;
      full_name: string | null;
      email: string;
      department: string | null;
      employee_id: string | null;
      total_hours: number;
      days_present: number;
    }>;
  }>;
}
