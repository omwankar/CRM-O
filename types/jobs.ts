export type JobStatus =
  | 'booked'
  | 'in_transit'
  | 'arrived'
  | 'delivered'
  | 'pod_received'
  | 'closed'
  | 'cancelled';

export type JobModeType = 'air' | 'sea' | 'road';

export const JOB_STATUSES_ORDER: JobStatus[] = [
  'booked',
  'in_transit',
  'arrived',
  'delivered',
  'pod_received',
  'closed',
  'cancelled',
];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  booked: 'Booked',
  in_transit: 'In transit',
  arrived: 'Arrived',
  delivered: 'Delivered',
  pod_received: 'POD received',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

export const JOB_STATUS_BADGE: Record<JobStatus, string> = {
  booked: 'border border-blue-500/35 bg-blue-500/12 text-blue-800 dark:text-blue-200',
  in_transit: 'border border-amber-500/35 bg-amber-500/12 text-amber-900 dark:text-amber-200',
  arrived: 'border border-violet-500/35 bg-violet-500/12 text-violet-900 dark:text-violet-200',
  delivered: 'border border-emerald-500/35 bg-emerald-500/12 text-emerald-900 dark:text-emerald-200',
  pod_received: 'border border-teal-500/35 bg-teal-500/12 text-teal-900 dark:text-teal-200',
  closed: 'border border-slate-500/35 bg-slate-500/12 text-slate-800 dark:text-slate-200',
  cancelled: 'border border-red-500/35 bg-red-500/12 text-red-900 dark:text-red-200',
};

export const JOB_MODE_LABELS: Record<JobModeType, string> = {
  air: 'Air',
  sea: 'Sea',
  road: 'Road',
};

export interface JobPerson {
  id: string;
  name: string;
  email: string;
}

export interface JobAttachment {
  id: string;
  file_name: string;
  file_type: string | null;
  file_url: string;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface JobEmail {
  id: string;
  job_id: string;
  sender_name: string | null;
  sender_email: string | null;
  subject: string | null;
  body_preview: string | null;
  full_body: string | null;
  received_at: string;
  is_read: boolean;
}

export interface JobVendorLink {
  id: string;
  vendor_id: string;
  notes: string | null;
  added_at: string;
  vendor?: {
    id: string;
    vendor_name: string;
    contact_email?: string | null;
    vendor_type?: string | null;
  } | null;
}

export interface JobPartnerLink {
  id: string;
  partnership_id: string;
  notes: string | null;
  added_at: string;
  partner?: {
    id: string;
    partner_name: string;
    partner_type?: string | null;
    status?: string | null;
  } | null;
}

export interface JobStatusHistory {
  id: string;
  old_status: string | null;
  new_status: string;
  reason: string;
  changed_by_name: string;
  changed_at: string;
}

export interface Job {
  id: string;
  job_number: string;
  title: string;
  opportunity_id: string | null;
  quotation_id: string | null;
  invoice_id: string | null;
  buyer_id: string | null;
  origin: string | null;
  destination: string | null;
  cargo_description: string | null;
  weight_kg: number | null;
  volume_cbm: number | null;
  container_type: string | null;
  mode_type: JobModeType | null;
  status: JobStatus;
  supervisor_id: string | null;
  assigned_person_id: string | null;
  linked_email: string | null;
  notes: string | null;
  migrated_from_project_id?: string | null;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_person?: JobPerson | null;
  supervisor?: JobPerson | null;
  buyer?: { id: string; buyer_name: string; contact_email?: string | null } | null;
  opportunity?: { id: string; title: string; stage: string } | null;
  quotation?: { id: string; quotation_number: string; status: string } | null;
  invoice?: { id: string; invoice_number: string; status: string } | null;
  vendors?: JobVendorLink[];
  partners?: JobPartnerLink[];
  attachments?: JobAttachment[];
  emails?: JobEmail[];
}

export interface CreateJobInput {
  title: string;
  opportunity_id: string;
  quotation_id?: string | null;
  invoice_id?: string | null;
  buyer_id?: string | null;
  origin?: string | null;
  destination?: string | null;
  cargo_description?: string | null;
  weight_kg?: number | null;
  volume_cbm?: number | null;
  container_type?: string | null;
  mode_type?: JobModeType | null;
  status?: JobStatus;
  supervisor_id?: string | null;
  assigned_person_id?: string | null;
  linked_email?: string | null;
  notes?: string | null;
  vendor_ids?: string[];
  partnership_ids?: string[];
  created_by: string;
}

export interface UpdateJobInput {
  title?: string;
  quotation_id?: string | null;
  invoice_id?: string | null;
  buyer_id?: string | null;
  origin?: string | null;
  destination?: string | null;
  cargo_description?: string | null;
  weight_kg?: number | null;
  volume_cbm?: number | null;
  container_type?: string | null;
  mode_type?: JobModeType | null;
  status?: JobStatus;
  supervisor_id?: string | null;
  assigned_person_id?: string | null;
  linked_email?: string | null;
  notes?: string | null;
}

export interface ChangeJobStatusInput {
  status: JobStatus;
  reason: string;
  changed_by?: string;
}

export interface JobFilters {
  status?: JobStatus;
  search?: string;
  opportunity_id?: string;
  buyer_id?: string;
  mode_type?: JobModeType;
  sort_by?: 'created_at' | 'updated_at' | 'job_number' | 'title' | 'status';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface JobsListResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
