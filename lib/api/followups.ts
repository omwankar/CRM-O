import { apiRequest } from './client';
import type {
  FollowUp,
  FollowUpBucket,
  FollowUpEvent,
  FollowUpInput,
  FollowUpSummary,
} from '@/types/followups';

export async function getFollowUps(params: {
  scope?: 'mine' | 'all';
  bucket?: FollowUpBucket;
  assigned_to?: string;
} = {}) {
  const q = new URLSearchParams();
  if (params.scope) q.set('scope', params.scope);
  if (params.bucket) q.set('bucket', params.bucket);
  if (params.assigned_to) q.set('assigned_to', params.assigned_to);
  const qs = q.toString();
  return apiRequest(`/followups${qs ? `?${qs}` : ''}`) as Promise<{ data: FollowUp[]; scope: string }>;
}

export async function getFollowUpSummary(scope: 'mine' | 'all' = 'mine') {
  return apiRequest(`/followups/summary?scope=${scope}`) as Promise<FollowUpSummary>;
}

export async function createFollowUp(input: FollowUpInput) {
  return apiRequest('/followups', {
    method: 'POST',
    body: JSON.stringify(input),
  }) as Promise<FollowUp>;
}

export async function updateFollowUp(id: string, input: Partial<FollowUpInput> & { status?: FollowUp['status'] }) {
  return apiRequest(`/followups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  }) as Promise<FollowUp>;
}

export async function deleteFollowUp(id: string) {
  return apiRequest(`/followups/${id}`, { method: 'DELETE' });
}

export async function getFollowUpEvents(id: string) {
  return apiRequest(`/followups/${id}/events`) as Promise<FollowUpEvent[]>;
}
