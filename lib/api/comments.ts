import { apiRequest } from '@/lib/api/client';

export async function getComments(params?: { related_table?: string; related_id?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.related_table) query.append('related_table', params.related_table);
  if (params?.related_id) query.append('related_id', params.related_id);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  return apiRequest(`/comments?${query}`);
}

export async function getComment(id: string) {
  return apiRequest(`/comments/${id}`);
}

export async function createComment(data: any) {
  return apiRequest('/comments', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateComment(id: string, data: any) {
  return apiRequest(`/comments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteComment(id: string) {
  return apiRequest(`/comments/${id}`, { method: 'DELETE' });
}
