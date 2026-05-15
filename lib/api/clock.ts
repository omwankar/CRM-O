import { apiRequest } from '@/lib/api/client';

async function sameOriginJson(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    credentials: 'include',
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || 'Request failed');
  return body;
}

// Employee clock in/out uses same-origin Next.js routes (works in production without NEXT_PUBLIC_API_URL).
export async function getClockSessions(month?: string) {
  const qs = month ? `?month=${encodeURIComponent(month)}` : '';
  return sameOriginJson(`/api/clock/sessions${qs}`);
}

export async function clockIn() {
  return sameOriginJson('/api/clock/clock-in', { method: 'POST' });
}

export async function clockOut() {
  return sameOriginJson('/api/clock/clock-out', { method: 'POST' });
}

export async function createMissedPunchRequest(data: { type: 'clock_in' | 'clock_out'; requested_at: string; reason?: string }) {
  return sameOriginJson('/api/clock/missed-punch', { method: 'POST', body: JSON.stringify(data) });
}

// Super Admin: Punch Request Management (kept on backend API)
export async function getPunchRequests(params?: { status?: string; page?: number; limit?: number; search?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.search) query.append('search', params.search);
  return apiRequest(`/clock/punch-requests?${query}`);
}

export async function getPunchStats() {
  return apiRequest('/clock/punch-requests/stats');
}

export async function approvePunchRequest(id: string, notes?: string) {
  return apiRequest(`/clock/punch-requests/${id}/approve`, { method: 'PUT', body: JSON.stringify({ notes }) });
}

export async function rejectPunchRequest(id: string, rejection_reason: string) {
  return apiRequest(`/clock/punch-requests/${id}/reject`, { method: 'PUT', body: JSON.stringify({ rejection_reason }) });
}

export type LeaveRequest = {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  leave_type: 'paid' | 'unpaid' | 'lop';
  status: string;
  created_at: string;
};

export async function getMyLeaveRequests() {
  return apiRequest('/clock/leave-requests') as Promise<{ data: LeaveRequest[] }>;
}

export async function submitLeaveRequest(data: {
  start_date: string;
  end_date: string;
  reason?: string;
  leave_type: 'paid' | 'unpaid' | 'lop';
}) {
  return apiRequest('/clock/leave-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
