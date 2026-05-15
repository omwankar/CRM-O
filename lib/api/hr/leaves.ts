import { apiRequest } from '@/lib/api/client';

export type LeaveRequest = {
  id: string;
  requested_by: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  leave_type: 'paid' | 'unpaid' | 'lop';
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  requester_name?: string;
  reviewer_name?: string | null;
};

export async function getHrLeaves(params?: { scope?: 'mine' | 'all'; status?: string }) {
  const q = new URLSearchParams();
  if (params?.scope) q.set('scope', params.scope);
  if (params?.status) q.set('status', params.status);
  const query = q.toString();
  return apiRequest(`/hr/leaves${query ? `?${query}` : ''}`) as Promise<{ data: LeaveRequest[] }>;
}

export async function submitLeave(data: { start_date: string; end_date: string; reason?: string }) {
  return apiRequest('/hr/leaves', { method: 'POST', body: JSON.stringify(data) });
}

export async function decideLeave(id: string, status: 'approved' | 'rejected') {
  return apiRequest(`/hr/leaves/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
