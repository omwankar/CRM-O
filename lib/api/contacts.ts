import { apiRequest } from './client';

export type ContactLinkEntityType =
  | 'lead'
  | 'opportunity'
  | 'buyer'
  | 'vendor'
  | 'company'
  | 'partnership';

export interface ContactLink {
  id?: string;
  entity_type: ContactLinkEntityType;
  entity_id: string;
  role?: string | null;
  label?: string | null;
  created_at?: string;
}

export interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  designation: string | null;
  company: string | null;
  buyer_id: string | null;
  vendor_id: string | null;
  lead_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  buyer?: { id: string; buyer_name: string } | null;
  vendor?: { id: string; vendor_name: string } | null;
  lead?: { id: string; lead_name: string } | null;
  links?: ContactLink[];
}

export interface ContactInput {
  full_name: string;
  email?: string | null;
  phone?: string | null;
  designation?: string | null;
  company?: string | null;
  buyer_id?: string | null;
  vendor_id?: string | null;
  lead_id?: string | null;
  notes?: string | null;
  links?: Array<{
    entity_type: ContactLinkEntityType;
    entity_id: string;
    role?: string | null;
  }>;
}

export async function getContacts(
  params: {
    search?: string;
    page?: number;
    limit?: number;
    entity_type?: ContactLinkEntityType;
    entity_id?: string;
  } = {},
) {
  const q = new URLSearchParams();
  if (params.search) q.set('search', params.search);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.entity_type) q.set('entity_type', params.entity_type);
  if (params.entity_id) q.set('entity_id', params.entity_id);
  const qs = q.toString();
  return apiRequest(`/contacts${qs ? `?${qs}` : ''}`) as Promise<{
    data: Contact[];
    total: number;
    page: number;
    totalPages: number;
  }>;
}

export async function getContact(id: string) {
  return apiRequest(`/contacts/${id}`) as Promise<Contact>;
}

export async function createContact(input: ContactInput) {
  return apiRequest('/contacts', { method: 'POST', body: JSON.stringify(input) }) as Promise<Contact>;
}

export async function updateContact(id: string, input: Partial<ContactInput>) {
  return apiRequest(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(input) }) as Promise<Contact>;
}

export async function deleteContact(id: string) {
  return apiRequest(`/contacts/${id}`, { method: 'DELETE' });
}
