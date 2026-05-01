import { apiRequest } from '@/lib/api/client';

export async function getDashboardStats() {
  return apiRequest('/dashboard/stats');
}
