import { apiRequest } from '@/lib/api/client';

export interface QuotationReport {
  from: string;
  to: string;
  total: number;
  won: number;
  lost: number;
  cancelled: number;
  overdue: number;
  by_status: Record<string, number>;
  by_stage: Record<string, number>;
  monthly_trend: Array<{ month: string; count: number }>;
}

export interface LeaveReport {
  from: string;
  to: string;
  total: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  days_by_employee: Array<{ user_id: string; name: string; days: number }>;
}

export interface TimelogReport {
  month: string;
  manager_view: boolean;
  rows: Array<{
    user_id: string;
    name: string;
    clocked_hours: number;
    logged_hours: number;
    idle_hours: number;
    utilization: number;
  }>;
}

export interface CompanyMonthlyReport {
  month: string;
  headcount_active: number;
  quotations: { received: number; won: number; lost: number };
  total_clock_hours: number;
  leave_requests: number;
  approved_leaves: number;
  holidays: number;
}

export async function getQuotationReport(params?: { from?: string; to?: string }) {
  const q = new URLSearchParams();
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  const query = q.toString();
  return apiRequest(`/reports/quotations${query ? `?${query}` : ''}`) as Promise<QuotationReport>;
}

export async function getLeaveReport(params?: { from?: string; to?: string }) {
  const q = new URLSearchParams();
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  const query = q.toString();
  return apiRequest(`/reports/leave${query ? `?${query}` : ''}`) as Promise<LeaveReport>;
}

export async function getTimelogReport(month?: string) {
  const query = month ? `?month=${month}` : '';
  return apiRequest(`/reports/timelog${query}`) as Promise<TimelogReport>;
}

export async function getCompanyMonthlyReport(month?: string) {
  const query = month ? `?month=${month}` : '';
  return apiRequest(`/reports/company-monthly${query}`) as Promise<CompanyMonthlyReport>;
}
