import { apiRequest } from '@/lib/api/client';

export async function getDocuments(params?: { related_table?: string; related_id?: string; document_type?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.related_table) query.append('related_table', params.related_table);
  if (params?.related_id) query.append('related_id', params.related_id);
  if (params?.document_type) query.append('document_type', params.document_type);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  return apiRequest(`/documents?${query}`);
}

export async function getDocument(id: string) {
  return apiRequest(`/documents/${id}`);
}

export async function createDocument(data: any) {
  return apiRequest('/documents', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateDocument(id: string, data: any) {
  return apiRequest(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteDocument(id: string) {
  return apiRequest(`/documents/${id}`, { method: 'DELETE' });
}
