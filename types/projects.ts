export interface Project {
  id: string;
  project_id: string;
  project_name: string;
  start_date: string | null;
  estimated_end_date: string | null;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  requirements_notes: string;
  linked_email: string | null;
  status: 'Active' | 'Planned' | 'On Hold' | 'Closed';
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  employees?: ProjectEmployee[];
  attachments?: ProjectAttachment[];
  emails?: ProjectEmail[];
}

export interface ProjectEmployee {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'admin' | 'assigned' | 'operations' | 'sales';
  avatar_initials: string;
  added_at: string;
}

export interface ProjectAttachment {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: number;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface ProjectEmail {
  id: string;
  project_id: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  body_preview: string;
  full_body: string;
  received_at: string;
  is_read: boolean;
}

export interface StatusHistory {
  id: string;
  old_status: string | null;
  new_status: string;
  reason: string;
  changed_by_name: string;
  changed_at: string;
}

export interface CreateProjectInput {
  project_name: string;
  contact_person: string;
  contact_email?: string;
  contact_phone?: string;
  start_date?: string;
  estimated_end_date?: string;
  requirements_notes?: string;
  linked_email?: string;
  status?: 'Active' | 'Planned' | 'On Hold' | 'Closed';
  created_by: string;
}

export interface UpdateProjectInput {
  project_name?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  start_date?: string;
  estimated_end_date?: string;
  requirements_notes?: string;
  linked_email?: string;
  status?: 'Active' | 'Planned' | 'On Hold' | 'Closed';
}

export interface ChangeStatusInput {
  status: 'Active' | 'Planned' | 'On Hold' | 'Closed';
  reason: string;
  changed_by: string;
}

export interface AddEmployeeInput {
  user_id: string;
  role: 'admin' | 'assigned' | 'operations' | 'sales';
}

export interface ProjectFilters {
  status?: 'Active' | 'Planned' | 'On Hold' | 'Closed';
  search?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface ProjectsListResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type ProjectRole = 'admin' | 'assigned' | 'operations' | 'sales';
