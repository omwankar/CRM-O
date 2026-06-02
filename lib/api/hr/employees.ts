import { apiRequest } from '@/lib/api/client';

export type HrEmployee = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  department: string | null;
  employee_id: string | null;
  designation: string | null;
  joining_date: string | null;
  employment_type: string | null;
  work_mode: string | null;
  monthly_salary: number | null;
  annual_leave_allowance: number | null;
  employment_status: string | null;
  reporting_manager_id: string | null;
  reporting_manager_name?: string | null;
  is_active: boolean;
  avatar_url: string | null;
  last_login: string | null;
  created_at: string;
  reporting_manager?: { id: string; full_name: string | null; email: string } | null;
};

export async function getHrEmployees(params?: {
  search?: string;
  department?: string;
  designation?: string;
  employment_status?: string;
  page?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  if (params?.department) q.set('department', params.department);
  if (params?.designation) q.set('designation', params.designation);
  if (params?.employment_status) q.set('employment_status', params.employment_status);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const query = q.toString();
  return apiRequest(`/hr/employees${query ? `?${query}` : ''}`) as Promise<{
    data: HrEmployee[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
}

export async function getHrEmployee(id: string) {
  return apiRequest(`/hr/employees/${id}`) as Promise<HrEmployee>;
}

export async function updateHrEmployee(id: string, data: Partial<HrEmployee>) {
  return apiRequest(`/hr/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }) as Promise<HrEmployee>;
}
