import { apiRequest } from '@/lib/api/client';

export async function getAlerts(params?: { alert_type?: string; is_dismissed?: boolean; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.alert_type) query.append('alert_type', params.alert_type);
  if (params?.is_dismissed !== undefined) query.append('is_dismissed', params.is_dismissed.toString());
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  return apiRequest(`/alerts?${query}`);
}

export async function getAlert(id: string) {
  return apiRequest(`/alerts/${id}`);
}

export async function createAlert(data: any) {
  return apiRequest('/alerts', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateAlert(id: string, data: any) {
  return apiRequest(`/alerts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteAlert(id: string) {
  return apiRequest(`/alerts/${id}`, { method: 'DELETE' });
}
