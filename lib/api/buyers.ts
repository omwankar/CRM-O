import { apiRequest } from '@/lib/api/client';

export async function getBuyers(params?: { search?: string; industry?: string; pipeline_stage_id?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.industry) query.append('industry', params.industry);
  if (params?.pipeline_stage_id) query.append('pipeline_stage_id', params.pipeline_stage_id);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  return apiRequest(`/buyers?${query}`);
}

export async function getBuyer(id: string) {
  return apiRequest(`/buyers/${id}`);
}

export async function createBuyer(data: any) {
  return apiRequest('/buyers', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateBuyer(id: string, data: any) {
  return apiRequest(`/buyers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteBuyer(id: string) {
  return apiRequest(`/buyers/${id}`, { method: 'DELETE' });
}
