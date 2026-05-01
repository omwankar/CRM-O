import { apiRequest } from '@/lib/api/client';

export async function getCalendarEvents(params?: { start_date?: string; end_date?: string; event_type?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.start_date) query.append('start_date', params.start_date);
  if (params?.end_date) query.append('end_date', params.end_date);
  if (params?.event_type) query.append('event_type', params.event_type);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  return apiRequest(`/calendar?${query}`);
}

export async function getCalendarEvent(id: string) {
  return apiRequest(`/calendar/${id}`);
}

export async function createCalendarEvent(data: any) {
  return apiRequest('/calendar', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateCalendarEvent(id: string, data: any) {
  return apiRequest(`/calendar/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteCalendarEvent(id: string) {
  return apiRequest(`/calendar/${id}`, { method: 'DELETE' });
}
