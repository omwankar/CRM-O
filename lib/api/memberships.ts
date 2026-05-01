import { apiRequest } from '@/lib/api/client';

export async function getMemberships(params?: { search?: string; status?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.status) query.append('status', params.status);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  return apiRequest(`/memberships?${query}`);
}

export async function getMembership(id: string) {
  return apiRequest(`/memberships/${id}`);
}

export async function createMembership(data: any) {
  return apiRequest('/memberships', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateMembership(id: string, data: any) {
  return apiRequest(`/memberships/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteMembership(id: string) {
  return apiRequest(`/memberships/${id}`, { method: 'DELETE' });
}
