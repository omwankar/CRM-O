import { apiRequest } from '@/lib/api/client';

export type PartnerStatus = 'active' | 'inactive' | 'on_hold';

export interface Partnership {
  id: string;
  partner_name: string;
  partner_company_name?: string | null;
  partner_type?: string | null;
  partnership_type?: string | null;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  start_date: string;
  end_date?: string | null;
  status?: PartnerStatus | null;
  description?: string | null;
  terms_url?: string | null;
  company_id?: string | null;
  company?: { id: string; name: string; company_types?: string[] } | null;
  sibling_vendors?: Array<{ id: string; vendor_name: string }>;
  sibling_buyers?: Array<{ id: string; buyer_name: string }>;
  also_vendor?: boolean;
  also_buyer?: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PartnershipInput {
  partner_name: string;
  partner_company_name?: string | null;
  partner_type?: string | null;
  partnership_type?: string | null;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  start_date: string;
  end_date?: string | null;
  status?: PartnerStatus;
  description?: string | null;
  terms_url?: string | null;
  company_id?: string | null;
}

export const PARTNER_TYPES = [
  'Logistics',
  'Customs',
  'Agent',
  'Strategic',
  'Supplier',
  'Technology',
] as const;

export async function getPartnerships(params?: {
  search?: string;
  status?: string;
  partner_type?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.status) query.append('status', params.status);
  if (params?.partner_type) query.append('partner_type', params.partner_type);
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  return apiRequest(`/partnerships?${query}`) as Promise<{
    data: Partnership[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
}

export async function getPartnership(id: string) {
  return apiRequest(`/partnerships/${id}`) as Promise<Partnership>;
}

export async function getPartnershipJobs(id: string) {
  return apiRequest(`/partnerships/${id}/jobs`) as Promise<{
    data: Array<{
      link_id: string;
      notes: string | null;
      added_at: string;
      job: {
        id: string;
        job_number: string;
        title: string;
        status: string;
        origin: string | null;
        destination: string | null;
        mode_type: string | null;
        created_at: string;
      };
    }>;
  }>;
}

export async function createPartnership(data: PartnershipInput) {
  return apiRequest('/partnerships', {
    method: 'POST',
    body: JSON.stringify(data),
  }) as Promise<Partnership>;
}

export async function updatePartnership(id: string, data: Partial<PartnershipInput>) {
  return apiRequest(`/partnerships/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }) as Promise<Partnership>;
}

export async function deletePartnership(id: string) {
  return apiRequest(`/partnerships/${id}`, { method: 'DELETE' });
}
