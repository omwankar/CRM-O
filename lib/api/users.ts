import { apiRequest } from '@/lib/api/client';

export async function getUsers(params?: { search?: string; role?: string; is_active?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.role) query.append('role', params.role);
  if (params?.is_active) query.append('is_active', params.is_active);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  return apiRequest(`/users?${query}`);
}

export async function getUser(id: string) {
  return apiRequest(`/users/${id}`);
}

export async function getCurrentUser() {
  return apiRequest('/users/me');
}

export async function inviteUser(data: { email: string; full_name: string; role: string; department?: string; phone?: string }) {
  return apiRequest('/users/invite', { method: 'POST', body: JSON.stringify(data) });
}

/**
 * Instantly create a user (super_admin only). No email confirmation - the
 * new user can sign in with the returned credentials right away.
 * `password` is optional; if omitted, the backend generates and returns one.
 */
export async function createUser(data: {
  email: string;
  full_name: string;
  role: string;
  password?: string;
  department?: string;
  phone?: string;
  employee_id?: string;
  employment_type?: 'full_time' | 'part_time' | 'probation' | 'commission';
  work_mode?: 'office' | 'remote';
}): Promise<{
  user: any;
  credentials: {
    email: string;
    employee_id: string;
    password: string;
    password_was_generated: boolean;
  };
  message: string;
}> {
  return apiRequest('/users', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateUser(id: string, data: { full_name?: string; role?: string; department?: string; phone?: string; is_active?: boolean }) {
  return apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deactivateUser(id: string) {
  return apiRequest(`/users/${id}/deactivate`, { method: 'POST' });
}

export async function reactivateUser(id: string) {
  return apiRequest(`/users/${id}/reactivate`, { method: 'POST' });
}

export async function resetUserPassword(id: string) {
  return apiRequest(`/users/${id}/reset-password`, { method: 'POST' });
}
