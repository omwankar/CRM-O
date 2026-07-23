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

// --- Sales reports ---

export interface SalesPipelineReport {
  stages: Array<{ stage: string; count: number; total_value: number }>;
  summary: {
    open_count: number;
    open_value: number;
    won_count: number;
    won_value: number;
    total_count: number;
  };
}

export interface SalesFunnelReport {
  from: string;
  to: string;
  source: string;
  steps: Array<{
    key: string;
    label: string;
    count: number;
    conversion_from_prev_pct?: number | null;
  }>;
  overall_lead_to_won_pct: number | null;
  by_source: Array<{
    source: string;
    leads: number;
    opportunities: number;
    quotations: number;
    won: number;
    lead_to_opp_pct: number | null;
    opp_to_quote_pct: number | null;
    quote_to_won_pct: number | null;
  }>;
}

export interface SalesRepPerformanceReport {
  from: string;
  to: string;
  manager_view: boolean;
  reps: Array<{
    owner_id: string;
    name: string;
    won: number;
    lost: number;
    open: number;
    won_value: number;
    avg_deal_size: number | null;
    avg_days_to_close: number | null;
    activity_count: number;
  }>;
}

export interface SalesStaleReport {
  days: number;
  summary: { stale_opportunities: number; stale_enquiries: number };
  opportunities: Array<{
    id: string;
    title: string;
    stage: string;
    value: number | null;
    currency: string | null;
    owner_id: string | null;
    owner_name: string | null;
    expected_close_date: string | null;
    last_activity_at: string | null;
    days_since_last_activity: number | null;
  }>;
  enquiries: Array<{
    id: string;
    enquiry_number: string | null;
    title: string | null;
    stage: string;
    owner_id: string | null;
    owner_name: string | null;
    deadline: string | null;
    last_activity_at: string | null;
    days_since_last_activity: number | null;
  }>;
}

export interface SalesQuotationWinRateReport {
  from: string;
  to: string;
  total: number;
  sent: number;
  won: number;
  lost: number;
  cancelled: number;
  win_rate_pct: number | null;
  loss_rate_pct: number | null;
  avg_revisions_before_close: number | null;
}

export interface SalesForecastReport {
  stage_weights: Record<string, number>;
  by_month: Array<{
    month: string;
    deals: number;
    pipeline_value: number;
    weighted_value: number;
  }>;
  summary: {
    open_deals: number;
    pipeline_value: number;
    weighted_forecast: number;
  };
}

function salesQs(params?: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '' && v !== 'all') q.set(k, String(v));
    }
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function getSalesPipelineReport() {
  return apiRequest('/reports/sales/pipeline') as Promise<SalesPipelineReport>;
}

export async function getSalesFunnelReport(params?: { from?: string; to?: string; source?: string }) {
  return apiRequest(`/reports/sales/funnel${salesQs(params)}`) as Promise<SalesFunnelReport>;
}

export async function getSalesRepPerformanceReport(params?: { from?: string; to?: string }) {
  return apiRequest(`/reports/sales/rep-performance${salesQs(params)}`) as Promise<SalesRepPerformanceReport>;
}

export async function getSalesStaleReport(days?: number) {
  return apiRequest(`/reports/sales/stale${salesQs({ days })}`) as Promise<SalesStaleReport>;
}

export async function getSalesQuotationWinRateReport(params?: { from?: string; to?: string }) {
  return apiRequest(
    `/reports/sales/quotation-win-rate${salesQs(params)}`,
  ) as Promise<SalesQuotationWinRateReport>;
}

export async function getSalesForecastReport() {
  return apiRequest('/reports/sales/forecast') as Promise<SalesForecastReport>;
}
