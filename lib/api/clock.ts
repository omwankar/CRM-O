import { apiRequest } from '@/lib/api/client';

export async function getClockSessions() {
  return apiRequest('/clock/sessions');
}

export async function getCurrentSession() {
  return apiRequest('/clock/sessions/current');
}

export async function clockIn(notes?: string) {
  return apiRequest('/clock/clock-in', { method: 'POST', body: JSON.stringify({ notes }) });
}

export async function clockOut(notes?: string) {
  return apiRequest('/clock/clock-out', { method: 'POST', body: JSON.stringify({ notes }) });
}

export async function getMissedPunchRequests() {
  return apiRequest('/clock/missed-punch-requests');
}

export async function createMissedPunchRequest(data: { type: 'clock_in' | 'clock_out'; requested_at: string; reason?: string }) {
  return apiRequest('/clock/missed-punch-requests', { method: 'POST', body: JSON.stringify(data) });
}

export async function approveMissedPunch(id: string) {
  return apiRequest(`/clock/missed-punch-requests/${id}/approve`, { method: 'PUT' });
}

export async function rejectMissedPunch(id: string) {
  return apiRequest(`/clock/missed-punch-requests/${id}/reject`, { method: 'PUT' });
}

// Super Admin: Punch Request Management
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
