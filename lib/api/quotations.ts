import { apiRequest, getApiBase } from '@/lib/api/client';
import type {
  CreateFollowupInput,
  CreateQuotationInput,
  Quotation,
  QuotationFollowup,
  QuotationStatus,
  UpdateFollowupInput,
  UpdateQuotationInput,
  VendorQuote,
} from '@/types/quotations';

export async function getQuotations(filters?: {
  status?: QuotationStatus;
  project_id?: string;
  enquiry_lead?: string;
  search?: string;
  from_deadline?: string;
  to_deadline?: string;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.project_id) params.append('project_id', filters.project_id);
  if (filters?.enquiry_lead) params.append('enquiry_lead', filters.enquiry_lead);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.from_deadline) params.append('from_deadline', filters.from_deadline);
  if (filters?.to_deadline) params.append('to_deadline', filters.to_deadline);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));
  return apiRequest(`/quotations?${params.toString()}`);
}

export async function getQuotationById(id: string): Promise<Quotation> {
  return apiRequest(`/quotations/${id}`);
}

export async function getQuotationStats(): Promise<{
  total: number;
  by_status: Record<QuotationStatus, number>;
  overdue: number;
  this_month: number;
}> {
  return apiRequest('/quotations/stats');
}

export async function createQuotation(data: CreateQuotationInput): Promise<Quotation> {
  return apiRequest('/quotations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateQuotation(id: string, data: UpdateQuotationInput): Promise<Quotation> {
  return apiRequest(`/quotations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteQuotation(id: string): Promise<void> {
  await apiRequest(`/quotations/${id}`, { method: 'DELETE' });
}

export async function addVendorQuote(
  quotation_id: string,
  data: Omit<VendorQuote, 'id' | 'quotation_id' | 'created_at' | 'is_chosen'>
) {
  return apiRequest(`/quotations/${quotation_id}/vendor-quotes`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateVendorQuote(id: string, data: Partial<VendorQuote>) {
  return apiRequest(`/quotations/vendor-quotes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteVendorQuote(id: string) {
  return apiRequest(`/quotations/vendor-quotes/${id}`, { method: 'DELETE' });
}

export async function chooseVendorQuote(quotation_id: string, vendor_quote_id: string) {
  return apiRequest(`/quotations/${quotation_id}/choose-vendor-quote`, {
    method: 'POST',
    body: JSON.stringify({ vendor_quote_id }),
  });
}

export async function addFollowup(quotationId: string, data: CreateFollowupInput): Promise<QuotationFollowup> {
  return apiRequest(`/quotations/${quotationId}/followups`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateFollowup(followupId: string, data: UpdateFollowupInput): Promise<QuotationFollowup> {
  return apiRequest(`/quotations/followups/${followupId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteFollowup(followupId: string): Promise<void> {
  await apiRequest(`/quotations/followups/${followupId}`, { method: 'DELETE' });
}

export async function sendQuotation(id: string, payload: { email: string; message?: string }) {
  return apiRequest(`/quotations/${id}/send`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchQuotationPdfBlob(id: string): Promise<Blob> {
  const { supabase } = await import('@/lib/auth');
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await fetch(`${getApiBase()}/quotations/${id}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to load quotation PDF');
  }
  return res.blob();
}

