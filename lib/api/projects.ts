import type {
  Project,
  ProjectsListResponse,
  CreateProjectInput,
  UpdateProjectInput,
  ChangeStatusInput,
  AddEmployeeInput,
  ProjectFilters,
  StatusHistory,
  ProjectEmployee,
  ProjectAttachment,
  ProjectEmail,
} from '@/types/projects';
import { apiRequest } from '@/lib/api/client';

export async function getProjects(filters: ProjectFilters = {}): Promise<ProjectsListResponse> {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  return apiRequest(`/projects?${params.toString()}`);
}

export async function getProject(id: string): Promise<Project> {
  return apiRequest(`/projects/${id}`);
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  return apiRequest('/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
  return apiRequest(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await apiRequest(`/projects/${id}`, {
    method: 'DELETE',
  });
}

export async function changeProjectStatus(id: string, input: ChangeStatusInput): Promise<Project> {
  return apiRequest(`/projects/${id}/status`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getProjectHistory(id: string): Promise<StatusHistory[]> {
  return apiRequest(`/projects/${id}/history`);
}

export async function addProjectEmployee(id: string, input: AddEmployeeInput): Promise<ProjectEmployee> {
  return apiRequest(`/projects/${id}/employees`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function removeProjectEmployee(id: string, userId: string): Promise<void> {
  await apiRequest(`/projects/${id}/employees/${userId}`, {
    method: 'DELETE',
  });
}

export async function addProjectAttachment(
  id: string,
  input: {
    file_name: string;
    file_type: string;
    file_url: string;
    file_size: number;
    uploaded_by: string;
  }
): Promise<ProjectAttachment> {
  return apiRequest(`/projects/${id}/attachments`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function deleteProjectAttachment(id: string, attachmentId: string): Promise<void> {
  await apiRequest(`/projects/${id}/attachments/${attachmentId}`, {
    method: 'DELETE',
  });
}

export async function getProjectEmails(id: string): Promise<ProjectEmail[]> {
  return apiRequest(`/projects/${id}/emails`);
}

export async function markProjectEmailAsRead(id: string, emailId: string): Promise<ProjectEmail> {
  return apiRequest(`/projects/${id}/emails/${emailId}/read`, {
    method: 'POST',
  });
}
