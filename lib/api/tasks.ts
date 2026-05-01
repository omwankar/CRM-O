import { apiRequest } from '@/lib/api/client';

export async function getTasks(params?: { assigned_to?: string; status?: string; priority?: string; related_table?: string; related_id?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.assigned_to) query.append('assigned_to', params.assigned_to);
  if (params?.status) query.append('status', params.status);
  if (params?.priority) query.append('priority', params.priority);
  if (params?.related_table) query.append('related_table', params.related_table);
  if (params?.related_id) query.append('related_id', params.related_id);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  return apiRequest(`/tasks?${query}`);
}

export async function getTask(id: string) {
  return apiRequest(`/tasks/${id}`);
}

export async function createTask(data: any) {
  return apiRequest('/tasks', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateTask(id: string, data: any) {
  return apiRequest(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteTask(id: string) {
  return apiRequest(`/tasks/${id}`, { method: 'DELETE' });
}
