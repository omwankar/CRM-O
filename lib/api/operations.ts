import { apiRequest } from './client';
import type { EnquiryInput } from '@/types/enquiries';

export type PipelineOperator = {
  user_id: string;
  full_name: string;
  status: string;
};

export type AgentSend = {
  id: string;
  enquiry_id: string;
  user_id: string;
  user_name: string;
  vendor_id?: string | null;
  agent_name: string;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  sent_at: string;
  quoted_price?: number | null;
  currency?: string | null;
  notes?: string | null;
  is_best: boolean;
  vendor_quote_id?: string | null;
};

export type InquiryUpdate = {
  id: string;
  enquiry_id: string;
  user_id: string | null;
  user_name: string;
  body: string;
  created_at: string;
};

export type BoardColumn = 'to_send' | 'waiting' | 'choose_best' | 'best_selected' | 'closed';

export type PipelineInquiry = {
  id: string;
  enquiry_number: string;
  title: string | null;
  requirement: string;
  route: string;
  stage: string;
  created_at: string;
  prospect_name: string | null;
  client_currency?: string | null;
  standalone_project_name?: string | null;
  client_price_notes?: string | null;
  outcome?: string | null;
  notes?: string | null;
  column: BoardColumn;
  priority_rank: number | null;
  rates_sent: number;
  rates_received: number;
  operators: PipelineOperator[];
  sends: AgentSend[];
  updates: InquiryUpdate[];
};

export type PipelineActivity = {
  id: string;
  at: string;
  user_id: string | null;
  user_name: string;
  enquiry_id: string;
  enquiry_number: string;
  text: string;
};

export type DirectoryAgent = {
  id: string;
  company_name: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  requests: number;
  rates: number;
  chosen: number;
};

export type DirectoryCustomer = {
  id: string;
  company_name: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  inquiries: number;
};

export type OperationsPipeline = {
  workload: Array<{ user_id: string; full_name: string; open_count: number; rates_awaited: number }>;
  inquiries: PipelineInquiry[];
  activity: PipelineActivity[];
  agents: DirectoryAgent[];
  customers?: DirectoryCustomer[];
  viewer_is_super_admin: boolean;
};

export async function getOperationsPipeline(includeClosed = false) {
  return apiRequest(`/operations/pipeline${includeClosed ? '?closed=1' : ''}`) as Promise<OperationsPipeline>;
}

export async function createOperationsEnquiry(input: EnquiryInput) {
  return apiRequest('/operations/enquiries', {
    method: 'POST',
    body: JSON.stringify(input),
  }) as Promise<{ id: string; enquiry_number: string }>;
}

export async function joinOperationsEnquiry(id: string) {
  return apiRequest(`/operations/enquiries/${id}/join`, { method: 'POST' });
}

export async function assignOperationsPeople(id: string, user_ids: string[]) {
  return apiRequest(`/operations/enquiries/${id}/assignees`, {
    method: 'PUT',
    body: JSON.stringify({ user_ids }),
  });
}

export async function addOperationsAgent(
  id: string,
  input: { agent_name?: string; contact_name?: string | null; contact_email?: string | null; contact_phone?: string | null; saved_agent_ids?: string[] },
) {
  return apiRequest(`/operations/enquiries/${id}/agents`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function saveOperationsRate(
  sendId: string,
  input: { quoted_price?: number | null; notes?: string | null; currency?: string | null },
) {
  return apiRequest(`/operations/agents/${sendId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function chooseOperationsBest(sendId: string) {
  return apiRequest(`/operations/agents/${sendId}/best`, { method: 'POST' });
}

export async function saveDirectoryAgent(input: { company_name: string; contact_name?: string | null; email?: string | null; phone?: string | null }, id?: string) {
  return apiRequest(id ? `/operations/directory/${id}` : '/operations/directory', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(input),
  });
}

export async function deleteDirectoryAgent(id: string) {
  return apiRequest(`/operations/directory/${id}`, { method: 'DELETE' });
}

export async function postInquiryUpdate(id: string, body: string) {
  return apiRequest(`/operations/enquiries/${id}/updates`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export async function closeOperationsEnquiry(id: string, input?: { outcome?: string; remark?: string | null }) {
  return apiRequest(`/operations/enquiries/${id}/close`, {
    method: 'POST',
    body: JSON.stringify(input || {}),
  });
}

export async function deleteOperationsEnquiry(id: string) {
  return apiRequest(`/operations/enquiries/${id}`, { method: 'DELETE' });
}

export async function clearOperationsPipeline() {
  return apiRequest('/operations/pipeline', { method: 'DELETE' }) as Promise<{ ok: boolean; deleted: number }>;
}

export async function saveDirectoryCustomer(input: { company_name: string; contact_name?: string | null; email?: string | null; phone?: string | null }, id?: string) {
  return apiRequest(id ? `/operations/customers/${id}` : '/operations/customers', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(input),
  });
}

export async function deleteDirectoryCustomer(id: string) {
  return apiRequest(`/operations/customers/${id}`, { method: 'DELETE' });
}
