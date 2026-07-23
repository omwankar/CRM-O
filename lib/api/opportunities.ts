import { apiRequest } from './client';
import type { Opportunity, OpportunityInput } from '@/types/opportunities';

export type { Opportunity, OpportunityInput };

export async function getOpportunities(
  params: {
    stage?: string;
    buyer_id?: string;
    search?: string;
    page?: number;
    limit?: number;
    trash?: boolean;
  } = {},
) {
  const q = new URLSearchParams();
  if (params.stage) q.set('stage', params.stage);
  if (params.buyer_id) q.set('buyer_id', params.buyer_id);
  if (params.search) q.set('search', params.search);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.trash) q.set('trash', '1');
  const qs = q.toString();
  return apiRequest(`/opportunities${qs ? `?${qs}` : ''}`) as Promise<{
    data: Opportunity[];
    total: number;
    page: number;
    totalPages: number;
  }>;
}

export async function getOpportunityStats() {
  return apiRequest('/opportunities/stats') as Promise<{
    total: number;
    by_stage: Record<string, number>;
    open_pipeline_value: number;
  }>;
}

export async function getOpportunity(id: string) {
  return apiRequest(`/opportunities/${id}`) as Promise<Opportunity>;
}

export async function createOpportunity(input: OpportunityInput) {
  return apiRequest('/opportunities', {
    method: 'POST',
    body: JSON.stringify(input),
  }) as Promise<Opportunity>;
}

export async function updateOpportunity(id: string, input: Partial<OpportunityInput>) {
  return apiRequest(`/opportunities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  }) as Promise<Opportunity>;
}

export async function deleteOpportunity(id: string) {
  return apiRequest(`/opportunities/${id}`, { method: 'DELETE' });
}

export async function restoreOpportunity(id: string) {
  return apiRequest(`/opportunities/${id}/restore`, { method: 'POST' }) as Promise<Opportunity>;
}
