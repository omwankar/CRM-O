import { apiRequest } from './client';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

export interface Lead {
  id: string;
  lead_name: string;
  company_name: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: LeadStatus;
  estimated_value: number | null;
  currency: string | null;
  notes: string | null;
  assigned_to: string | null;
  created_by: string | null;
  converted_buyer_id: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
  assignee?: { id: string; full_name: string } | null;
  creator?: { id: string; full_name: string } | null;
}

export interface LeadInput {
  lead_name: string;
  company_name?: string | null;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  status?: LeadStatus;
  estimated_value?: number | null;
  currency?: string | null;
  notes?: string | null;
  assigned_to?: string | null;
}

export async function getLeads(params: { status?: string; search?: string; page?: number; limit?: number } = {}) {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.search) q.set('search', params.search);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return apiRequest(`/leads${qs ? `?${qs}` : ''}`) as Promise<{
    data: Lead[];
    total: number;
    page: number;
    totalPages: number;
  }>;
}

export async function getLeadStats() {
  return apiRequest('/leads/stats') as Promise<{ total: number; by_status: Record<string, number> }>;
}

export async function createLead(input: LeadInput) {
  return apiRequest('/leads', { method: 'POST', body: JSON.stringify(input) }) as Promise<Lead>;
}

export async function updateLead(id: string, input: Partial<LeadInput>) {
  return apiRequest(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(input) }) as Promise<Lead>;
}

export async function convertLead(id: string) {
  return apiRequest(`/leads/${id}/convert`, { method: 'POST' }) as Promise<{ lead: Lead; buyer: { id: string } }>;
}

export async function deleteLead(id: string) {
  return apiRequest(`/leads/${id}`, { method: 'DELETE' });
}
