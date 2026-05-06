import type {
  Task,
  TasksListResponse,
  CreateTaskInput,
  UpdateTaskInput,
  ChangeTaskStatusInput,
  TaskFilters,
  TaskStatusHistory,
  TaskAttachment,
  TaskEmail,
  TaskEmployee,
  AddTaskEmployeeInput,
} from '@/types/tasks';
import { apiRequest } from '@/lib/api/client';

export async function getTasks(filters: TaskFilters = {}): Promise<TasksListResponse> {
  const params = new URLSearchParams();

  if (filters.status) params.append('status', filters.status);
  if (filters.task_type) params.append('task_type', filters.task_type);
  if (filters.project_id) params.append('project_id', filters.project_id);
  if (filters.search) params.append('search', filters.search);
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  if (filters.sort_by) params.append('sort_by', filters.sort_by);
  if (filters.sort_order) params.append('sort_order', filters.sort_order);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  return apiRequest(`/tasks?${params.toString()}`);
}

export async function getTask(id: string): Promise<Task> {
  return apiRequest(`/tasks/${id}`);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  return apiRequest('/tasks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  return apiRequest(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteTask(id: string): Promise<void> {
  await apiRequest(`/tasks/${id}`, {
    method: 'DELETE',
  });
}

export async function changeTaskStatus(id: string, input: ChangeTaskStatusInput): Promise<Task> {
  return apiRequest(`/tasks/${id}/status`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getTaskHistory(id: string): Promise<TaskStatusHistory[]> {
  return apiRequest(`/tasks/${id}/history`);
}

export async function addTaskAttachment(
  id: string,
  input: {
    file_name: string;
    file_type: string;
    file_url: string;
    file_size: number;
    uploaded_by: string;
  }
): Promise<TaskAttachment> {
  return apiRequest(`/tasks/${id}/attachments`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function deleteTaskAttachment(id: string, attachmentId: string): Promise<void> {
  await apiRequest(`/tasks/${id}/attachments/${attachmentId}`, {
    method: 'DELETE',
  });
}

export async function getTaskEmails(id: string): Promise<TaskEmail[]> {
  return apiRequest(`/tasks/${id}/emails`);
}

export async function markTaskEmailAsRead(id: string, emailId: string): Promise<TaskEmail> {
  return apiRequest(`/tasks/${id}/emails/${emailId}/read`, {
    method: 'POST',
  });
}

export async function getTaskEmployees(id: string): Promise<TaskEmployee[]> {
  return apiRequest(`/tasks/${id}/employees`);
}

export async function addTaskEmployee(id: string, input: AddTaskEmployeeInput): Promise<TaskEmployee> {
  return apiRequest(`/tasks/${id}/employees`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function removeTaskEmployee(id: string, userId: string): Promise<void> {
  await apiRequest(`/tasks/${id}/employees/${userId}`, {
    method: 'DELETE',
  });
}
