import { apiRequest } from '@/lib/api/client';

export type Holiday = {
  id: string;
  date: string;
  title: string;
  description: string | null;
  event_type: string;
  created_by: string | null;
  created_at: string;
};

export async function getHrHolidays(params?: { year?: string }) {
  const q = new URLSearchParams();
  if (params?.year) q.set('year', params.year);
  const query = q.toString();
  return apiRequest(`/hr/holidays${query ? `?${query}` : ''}`) as Promise<{
    data: Holiday[];
    total: number;
  }>;
}

export async function createHoliday(data: { date: string; title: string; description?: string }) {
  return apiRequest('/hr/holidays', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateHoliday(id: string, data: Partial<{ date: string; title: string; description: string }>) {
  return apiRequest(`/hr/holidays/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteHoliday(id: string) {
  return apiRequest(`/hr/holidays/${id}`, { method: 'DELETE' });
}
