import { apiRequest, getApiBase } from '@/lib/api/client';
import type { CreateInvoiceInput, Invoice, UpdateInvoiceInput } from '@/types/invoices';

export type InvoiceCompanySettings = {
  name: string;
  phone: string;
  address: string;
  vat_number: string;
};

export async function getInvoiceCompanySettings() {
  return apiRequest('/invoices/settings/company') as Promise<InvoiceCompanySettings>;
}

export async function updateInvoiceCompanySettings(data: InvoiceCompanySettings) {
  return apiRequest('/invoices/settings/company', {
    method: 'PUT',
    body: JSON.stringify(data),
  }) as Promise<InvoiceCompanySettings>;
}

export async function getInvoices(params?: {
  status?: string;
  buyer_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.buyer_id) q.set('buyer_id', params.buyer_id);
  if (params?.search) q.set('search', params.search);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const query = q.toString();
  return apiRequest(`/invoices${query ? `?${query}` : ''}`) as Promise<{
    data: Invoice[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
}

export async function getInvoice(id: string) {
  return apiRequest(`/invoices/${id}`) as Promise<Invoice>;
}

export async function createInvoice(data: CreateInvoiceInput) {
  return apiRequest('/invoices', { method: 'POST', body: JSON.stringify(data) }) as Promise<Invoice>;
}

export async function createInvoiceFromQuotation(quotationId: string, buyerId: string, dueDate?: string) {
  return apiRequest(`/invoices/from-quotation/${quotationId}`, {
    method: 'POST',
    body: JSON.stringify({ buyer_id: buyerId, due_date: dueDate }),
  }) as Promise<Invoice>;
}

export async function updateInvoice(id: string, data: UpdateInvoiceInput) {
  return apiRequest(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }) as Promise<Invoice>;
}

export async function deleteInvoice(id: string) {
  return apiRequest(`/invoices/${id}`, { method: 'DELETE' });
}

export async function generateInvoicePdf(id: string) {
  return apiRequest(`/invoices/${id}/generate-pdf`, { method: 'POST' }) as Promise<Invoice & { pdf_download_url?: string; storage_warning?: string }>;
}

export async function sendInvoice(id: string, email?: string) {
  return apiRequest(`/invoices/${id}/send`, {
    method: 'POST',
    body: JSON.stringify(email ? { email } : {}),
  }) as Promise<Invoice>;
}

/** Fetch PDF blob with auth for preview/download */
export async function fetchInvoicePdfBlob(id: string): Promise<Blob> {
  const { supabase } = await import('@/lib/auth');
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await fetch(`${getApiBase()}/invoices/${id}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to load PDF');
  }
  return res.blob();
}
