import { apiRequest } from '@/lib/api/client';

export async function getVendors(params?: { search?: string; vendor_type?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.vendor_type) query.append('vendor_type', params.vendor_type);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  return apiRequest(`/vendors?${query}`);
}

export async function getVendor(id: string) {
  return apiRequest(`/vendors/${id}`);
}

export async function createVendor(data: any) {
  return apiRequest('/vendors', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateVendor(id: string, data: any) {
  return apiRequest(`/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteVendor(id: string) {
  return apiRequest(`/vendors/${id}`, { method: 'DELETE' });
}
