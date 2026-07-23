import { apiRequest } from './client';
import type { Enquiry, EnquiryInput, EnquiryStage } from '@/types/enquiries';

export type { Enquiry, EnquiryInput, EnquiryStage };

export async function getEnquiries(params: {
  stage?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  const q = new URLSearchParams();
  if (params.stage) q.set('stage', params.stage);
  if (params.search) q.set('search', params.search);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return apiRequest(`/enquiries${qs ? `?${qs}` : ''}`) as Promise<{
    data: Enquiry[];
    total: number;
    page: number;
    totalPages: number;
  }>;
}

export async function getEnquiryStats() {
  return apiRequest('/enquiries/stats') as Promise<{
    total: number;
    by_stage: Record<string, number>;
  }>;
}

export async function getEnquiry(id: string) {
  return apiRequest(`/enquiries/${id}`) as Promise<Enquiry>;
}

export async function createEnquiry(input: EnquiryInput) {
  return apiRequest('/enquiries', {
    method: 'POST',
    body: JSON.stringify(input),
  }) as Promise<Enquiry>;
}

export async function updateEnquiry(id: string, input: Partial<EnquiryInput>) {
  return apiRequest(`/enquiries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  }) as Promise<Enquiry>;
}

export async function convertEnquiryToQuotation(id: string) {
  return apiRequest(`/enquiries/${id}/convert`, { method: 'POST' }) as Promise<{
    enquiry: Enquiry;
    quotation: { id: string; quotation_number: string };
    credit_warning?: {
      credit_warning: true;
      message: string;
      credit_limit: number | null;
      credit_used: number;
      credit_available: number | null;
      proposed_value: number;
      would_exceed_by: number;
    };
  }>;
}

export async function deleteEnquiry(id: string) {
  return apiRequest(`/enquiries/${id}`, { method: 'DELETE' });
}
