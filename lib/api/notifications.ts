import { apiRequest } from './client';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export async function getNotifications(limit = 30): Promise<{ data: AppNotification[] }> {
  return apiRequest(`/notifications?limit=${limit}`);
}

export async function getUnreadCount(): Promise<{ count: number }> {
  return apiRequest('/notifications/unread-count');
}

export async function markNotificationRead(id: string) {
  return apiRequest(`/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead() {
  return apiRequest('/notifications/read-all', { method: 'POST' });
}
