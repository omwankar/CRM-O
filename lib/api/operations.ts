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
  sent_at: string;
  quoted_price?: number | null;
  currency?: string | null;
  notes?: string | null;
  is_best: boolean;
  vendor_quote_id?: string | null;
};

export type PipelineInquiry = {
  id: string;
  enquiry_number: string;
  title: string | null;
  requirement: string;
  stage: string;
  created_at: string;
  prospect_name: string | null;
  client_currency?: string | null;
  standalone_project_name?: string | null;
  operators: PipelineOperator[];
  sends: AgentSend[];
};

export type OperationsPipeline = {
  workload: Array<{ user_id: string; full_name: string; open_count: number }>;
  inquiries: PipelineInquiry[];
  viewer_is_super_admin: boolean;
};

export async function getOperationsPipeline() {
  return apiRequest('/operations/pipeline') as Promise<OperationsPipeline>;
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

export async function addOperationsAgent(id: string, agent_name: string) {
  return apiRequest(`/operations/enquiries/${id}/agents`, {
    method: 'POST',
    body: JSON.stringify({ agent_name }),
  });
}

export async function saveOperationsRate(sendId: string, quoted_price: number, currency?: string | null) {
  return apiRequest(`/operations/agents/${sendId}`, {
    method: 'PUT',
    body: JSON.stringify({ quoted_price, currency }),
  });
}

export async function chooseOperationsBest(sendId: string) {
  return apiRequest(`/operations/agents/${sendId}/best`, { method: 'POST' });
}
