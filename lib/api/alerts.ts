import { apiRequest } from '@/lib/api/client';

export type ExpiryAlert = {
  id: string;
  type: 'certification' | 'membership' | 'insurance';
  name: string;
  expiry_date: string;
  days_until_expiry: number;
  status: 'expired' | 'expiring_soon';
  href: string;
};

export async function getExpiringAlerts(params?: {
  cert_days?: number;
  membership_days?: number;
  insurance_days?: number;
}) {
  const query = new URLSearchParams();
  if (params?.cert_days) query.set('cert_days', String(params.cert_days));
  if (params?.membership_days) query.set('membership_days', String(params.membership_days));
  if (params?.insurance_days) query.set('insurance_days', String(params.insurance_days));
  const qs = query.toString();
  return apiRequest(`/alerts/expiring${qs ? `?${qs}` : ''}`) as Promise<{
    data: ExpiryAlert[];
    total: number;
    thresholds: { certification: number; membership: number; insurance: number };
  }>;
}

export async function getAlerts(params?: {
  alert_type?: string;
  is_dismissed?: boolean;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.alert_type) query.append('alert_type', params.alert_type);
  if (params?.is_dismissed !== undefined) query.append('is_dismissed', params.is_dismissed.toString());
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  return apiRequest(`/alerts?${query}`);
}

export async function getAlert(id: string) {
  return apiRequest(`/alerts/${id}`);
}

export async function createAlert(data: any) {
  return apiRequest('/alerts', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateAlert(id: string, data: any) {
  return apiRequest(`/alerts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteAlert(id: string) {
  return apiRequest(`/alerts/${id}`, { method: 'DELETE' });
}
