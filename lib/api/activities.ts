import { apiRequest } from './client';
import type { Activity, ActivityInput, ActivityEntityType } from '@/types/activities';

export type { Activity, ActivityInput };

export async function getActivities(
  params: {
    entity_type?: ActivityEntityType;
    entity_id?: string;
    type?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  const q = new URLSearchParams();
  if (params.entity_type) q.set('entity_type', params.entity_type);
  if (params.entity_id) q.set('entity_id', params.entity_id);
  if (params.type) q.set('type', params.type);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return apiRequest(`/activities${qs ? `?${qs}` : ''}`) as Promise<{
    data: Activity[];
    total: number;
    page: number;
    totalPages: number;
  }>;
}

export async function createActivity(input: ActivityInput) {
  return apiRequest('/activities', {
    method: 'POST',
    body: JSON.stringify(input),
  }) as Promise<Activity>;
}

export async function updateActivity(id: string, input: Partial<ActivityInput>) {
  return apiRequest(`/activities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  }) as Promise<Activity>;
}

export async function deleteActivity(id: string) {
  return apiRequest(`/activities/${id}`, { method: 'DELETE' });
}
