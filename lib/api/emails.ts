import { apiRequest } from './client';

export interface CompanyEmail {
  id: string;
  subject: string | null;
  sender_name: string | null;
  sender_email: string | null;
  mailbox_email: string;
  received_at: string;
  is_read: boolean;
  has_attachments: boolean;
  direction: 'inbound' | 'outbound';
  body_preview: string | null;
  body_html?: string | null;
  body_text?: string | null;
  lead_id: string | null;
  buyer_id: string | null;
  contact_id: string | null;
  project_id: string | null;
  quotation_id: string | null;
  conversation_id: string | null;
  email_category?: EmailCategory | null;
}

export type EmailCategory = 'lead' | 'quotation' | 'followup';

export interface Mailbox {
  id: string;
  email: string;
  display_name: string | null;
  last_synced_at: string | null;
  last_sync_error: string | null;
  is_active: boolean;
}

export interface EmailStats {
  total: number;
  unlinked: number;
  mailboxes: number;
  graph_configured: boolean;
  db_error?: string | null;
  mailbox_email?: string | null;
  scope?: 'company' | 'own';
  last_sync: {
    status: string;
    started_at: string;
    finished_at: string | null;
    mailboxes_synced: number;
    messages_upserted: number;
    error_message: string | null;
  } | null;
}

export async function getEmailStats() {
  return apiRequest('/emails/stats') as Promise<EmailStats>;
}

export async function getMailboxes() {
  return apiRequest('/emails/mailboxes') as Promise<{ data: Mailbox[] }>;
}

export async function getCompanyEmails(params: {
  search?: string;
  mailbox?: string;
  linked?: 'true' | 'false';
  category?: 'all' | 'lead' | 'quotation' | 'followup' | 'uncategorized';
  lead_id?: string;
  buyer_id?: string;
  project_id?: string;
  quotation_id?: string;
  page?: number;
  limit?: number;
} = {}) {
  const q = new URLSearchParams();
  if (params.search) q.set('search', params.search);
  if (params.mailbox) q.set('mailbox', params.mailbox);
  if (params.linked) q.set('linked', params.linked);
  if (params.category && params.category !== 'all') q.set('category', params.category);
  if (params.lead_id) q.set('lead_id', params.lead_id);
  if (params.buyer_id) q.set('buyer_id', params.buyer_id);
  if (params.project_id) q.set('project_id', params.project_id);
  if (params.quotation_id) q.set('quotation_id', params.quotation_id);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return apiRequest(`/emails${qs ? `?${qs}` : ''}`) as Promise<{
    data: CompanyEmail[];
    total: number;
    page: number;
    totalPages: number;
  }>;
}

export async function getCompanyEmail(id: string) {
  return apiRequest(`/emails/${id}`) as Promise<CompanyEmail>;
}

export async function discoverCompanyMailboxes() {
  return apiRequest('/emails/discover') as Promise<{
    total: number;
    included: number;
    excluded: number;
    data: Array<{
      displayName: string;
      mailboxEmail: string | null;
      allEmails: string[];
      included: boolean;
      reason: string;
    }>;
  }>;
}

export async function purgeSyncedEmails() {
  return apiRequest('/emails/purge', { method: 'POST' }) as Promise<{
    success: boolean;
    deleted_emails: number;
    message: string;
  }>;
}

export async function syncCompanyEmails() {
  return apiRequest('/emails/sync', { method: 'POST' }) as Promise<{
    success: boolean;
    mailboxes_synced: number;
    mailboxes_discovered?: number;
    messages_upserted: number;
    run_id: string;
  }>;
}

export async function linkCompanyEmail(
  id: string,
  links: {
    lead_id?: string | null;
    buyer_id?: string | null;
    contact_id?: string | null;
    project_id?: string | null;
    quotation_id?: string | null;
  },
) {
  return apiRequest(`/emails/${id}/link`, {
    method: 'PATCH',
    body: JSON.stringify(links),
  }) as Promise<CompanyEmail>;
}

export async function categorizeCompanyEmail(
  id: string,
  data: {
    email_category: EmailCategory | null;
    lead_id?: string | null;
    quotation_id?: string | null;
  },
) {
  return apiRequest(`/emails/${id}/categorize`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }) as Promise<CompanyEmail>;
}
