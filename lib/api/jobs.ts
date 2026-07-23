import type {
  Job,
  JobsListResponse,
  CreateJobInput,
  UpdateJobInput,
  ChangeJobStatusInput,
  JobFilters,
  JobStatusHistory,
  JobAttachment,
  JobVendorLink,
  JobPartnerLink,
} from '@/types/jobs';
import { apiRequest } from '@/lib/api/client';

export async function getJobs(filters: JobFilters = {}): Promise<JobsListResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  if (filters.opportunity_id) params.append('opportunity_id', filters.opportunity_id);
  if (filters.buyer_id) params.append('buyer_id', filters.buyer_id);
  if (filters.mode_type) params.append('mode_type', filters.mode_type);
  if (filters.sort_by) params.append('sort_by', filters.sort_by);
  if (filters.sort_order) params.append('sort_order', filters.sort_order);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  return apiRequest(`/jobs?${params.toString()}`);
}

export async function getJob(id: string): Promise<Job> {
  return apiRequest(`/jobs/${id}`);
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  return apiRequest('/jobs', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateJob(id: string, input: UpdateJobInput): Promise<Job> {
  return apiRequest(`/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteJob(id: string): Promise<void> {
  await apiRequest(`/jobs/${id}`, { method: 'DELETE' });
}

export async function changeJobStatus(id: string, input: ChangeJobStatusInput): Promise<Job> {
  return apiRequest(`/jobs/${id}/status`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getJobHistory(id: string): Promise<JobStatusHistory[]> {
  return apiRequest(`/jobs/${id}/history`);
}

export async function addJobVendor(
  id: string,
  input: { vendor_id: string; notes?: string | null }
): Promise<JobVendorLink> {
  return apiRequest(`/jobs/${id}/vendors`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function removeJobVendor(id: string, vendorId: string): Promise<void> {
  await apiRequest(`/jobs/${id}/vendors/${vendorId}`, { method: 'DELETE' });
}

export async function addJobPartner(
  id: string,
  input: { partnership_id: string; notes?: string | null }
): Promise<JobPartnerLink> {
  return apiRequest(`/jobs/${id}/partners`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function removeJobPartner(id: string, partnershipId: string): Promise<void> {
  await apiRequest(`/jobs/${id}/partners/${partnershipId}`, { method: 'DELETE' });
}

export async function addJobAttachment(
  id: string,
  input: {
    file_name: string;
    file_type: string;
    file_url: string;
    file_size: number;
    uploaded_by: string;
  }
): Promise<JobAttachment> {
  return apiRequest(`/jobs/${id}/attachments`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function deleteJobAttachment(id: string, attachmentId: string): Promise<void> {
  await apiRequest(`/jobs/${id}/attachments/${attachmentId}`, { method: 'DELETE' });
}
