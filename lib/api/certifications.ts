import { apiRequest } from '@/lib/api/client';

export async function getCertifications(params?: { search?: string; status?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.status) query.append('status', params.status);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  return apiRequest(`/certifications?${query}`);
}

export async function getCertification(id: string) {
  return apiRequest(`/certifications/${id}`);
}

export async function createCertification(data: any) {
  return apiRequest('/certifications', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCertification(id: string, data: any) {
  return apiRequest(`/certifications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCertification(id: string) {
  return apiRequest(`/certifications/${id}`, { method: 'DELETE' });
}
