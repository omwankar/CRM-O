import { apiRequest } from '@/lib/api/client';
import type { Announcement, CreateAnnouncementInput } from '@/types/workplace';

export async function getAnnouncements(params?: {
  category?: string;
  active_only?: boolean;
  page?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.category) q.set('category', params.category);
  if (params?.active_only) q.set('active_only', 'true');
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const query = q.toString();
  return apiRequest(`/announcements${query ? `?${query}` : ''}`) as Promise<{
    data: Announcement[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
}

export async function createAnnouncement(data: CreateAnnouncementInput) {
  return apiRequest('/announcements', { method: 'POST', body: JSON.stringify(data) }) as Promise<Announcement>;
}

export async function updateAnnouncement(id: string, data: Partial<CreateAnnouncementInput>) {
  return apiRequest(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }) as Promise<Announcement>;
}

export async function deleteAnnouncement(id: string) {
  return apiRequest(`/announcements/${id}`, { method: 'DELETE' });
}
