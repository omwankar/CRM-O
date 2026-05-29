import { apiRequest } from '@/lib/api/client';
import type { CreateTimeLogInput, TimeLog } from '@/types/workplace';

export async function getTimeLogs(params?: { month?: string; user_id?: string }) {
  const q = new URLSearchParams();
  if (params?.month) q.set('month', params.month);
  if (params?.user_id) q.set('user_id', params.user_id);
  const query = q.toString();
  return apiRequest(`/timelogs${query ? `?${query}` : ''}`) as Promise<{ data: TimeLog[] }>;
}

export async function createTimeLog(data: CreateTimeLogInput) {
  return apiRequest('/timelogs', { method: 'POST', body: JSON.stringify(data) }) as Promise<TimeLog>;
}

export async function updateTimeLog(id: string, data: Partial<CreateTimeLogInput>) {
  return apiRequest(`/timelogs/${id}`, { method: 'PUT', body: JSON.stringify(data) }) as Promise<TimeLog>;
}

export async function deleteTimeLog(id: string) {
  return apiRequest(`/timelogs/${id}`, { method: 'DELETE' });
}
