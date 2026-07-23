import { apiRequest } from './client';
import type { Company, CompanyInput } from '@/types/companies';

export type { Company, CompanyInput };

export async function getCompanies(
  params: {
    search?: string;
    type?: string;
    page?: number;
    limit?: number;
    trash?: boolean;
  } = {},
) {
  const q = new URLSearchParams();
  if (params.search) q.set('search', params.search);
  if (params.type) q.set('type', params.type);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.trash) q.set('trash', '1');
  const qs = q.toString();
  return apiRequest(`/companies${qs ? `?${qs}` : ''}`) as Promise<{
    data: Company[];
    total: number;
    page: number;
    totalPages: number;
  }>;
}

export async function getCompanyStats() {
  return apiRequest('/companies/stats') as Promise<{
    total: number;
    by_type: Record<string, number>;
  }>;
}

export async function getCompany(id: string) {
  return apiRequest(`/companies/${id}`) as Promise<Company>;
}

export async function createCompany(input: CompanyInput) {
  return apiRequest('/companies', {
    method: 'POST',
    body: JSON.stringify(input),
  }) as Promise<Company>;
}

export async function updateCompany(id: string, input: Partial<CompanyInput>) {
  return apiRequest(`/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  }) as Promise<Company>;
}

export async function deleteCompany(id: string) {
  return apiRequest(`/companies/${id}`, { method: 'DELETE' });
}

export async function restoreCompany(id: string) {
  return apiRequest(`/companies/${id}/restore`, { method: 'POST' }) as Promise<Company>;
}
