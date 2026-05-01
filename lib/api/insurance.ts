import { apiRequest } from '@/lib/api/client';

export async function getInsurance(params?: { search?: string; status?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.status) query.append('status', params.status);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  return apiRequest(`/insurance?${query}`);
}

export async function getInsurancePolicy(id: string) {
  return apiRequest(`/insurance/${id}`);
}

export async function createInsurance(data: any) {
  return apiRequest('/insurance', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateInsurance(id: string, data: any) {
  return apiRequest(`/insurance/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteInsurance(id: string) {
  return apiRequest(`/insurance/${id}`, { method: 'DELETE' });
}
