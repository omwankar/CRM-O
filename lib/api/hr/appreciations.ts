import { apiRequest } from '@/lib/api/client';

export type Appreciation = {
  id: string;
  employee_id: string;
  given_by: string;
  title: string;
  message: string | null;
  appreciation_date: string;
  category: string;
  employee_name?: string;
  given_by_name?: string;
  created_at: string;
};

export async function getHrAppreciations(params?: { employee_id?: string; page?: number }) {
  const q = new URLSearchParams();
  if (params?.employee_id) q.set('employee_id', params.employee_id);
  if (params?.page) q.set('page', String(params.page));
  const query = q.toString();
  return apiRequest(`/hr/appreciations${query ? `?${query}` : ''}`) as Promise<{
    data: Appreciation[];
    total: number;
    totalPages: number;
  }>;
}

export async function createAppreciation(data: {
  employee_id: string;
  title: string;
  message?: string;
  appreciation_date?: string;
  category?: string;
}) {
  return apiRequest('/hr/appreciations', { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteAppreciation(id: string) {
  return apiRequest(`/hr/appreciations/${id}`, { method: 'DELETE' });
}
