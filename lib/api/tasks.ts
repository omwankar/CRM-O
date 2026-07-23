import { apiRequest } from '@/lib/api/client';
import type { Task, TaskFilters, TaskInput, TasksListResponse } from '@/types/tasks';

export async function getTasks(filters: TaskFilters = {}): Promise<TasksListResponse> {
  const params = new URLSearchParams();
  if (filters.view) params.set('view', filters.view);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.priority && filters.priority !== 'all') params.set('priority', filters.priority);
  if (filters.overdue) params.set('overdue', '1');
  if (filters.search) params.set('search', filters.search);
  if (filters.entity_type) params.set('entity_type', filters.entity_type);
  if (filters.entity_id) params.set('entity_id', filters.entity_id);
  if (filters.assignee_id) params.set('assignee_id', filters.assignee_id);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  return apiRequest(`/tasks${qs ? `?${qs}` : ''}`);
}

export async function getTask(id: string): Promise<Task> {
  return apiRequest(`/tasks/${id}`);
}

export async function createTask(input: TaskInput): Promise<Task> {
  return apiRequest('/tasks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateTask(id: string, input: Partial<TaskInput> & { status?: string }): Promise<Task> {
  return apiRequest(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function completeTask(
  id: string,
  opts: {
    log_activity?: boolean;
    activity_type?: 'call' | 'email' | 'meeting' | 'note';
    activity_subject?: string | null;
    activity_notes?: string | null;
  } = {},
): Promise<Task> {
  return apiRequest(`/tasks/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify(opts),
  });
}

export async function deleteTask(id: string): Promise<void> {
  await apiRequest(`/tasks/${id}`, { method: 'DELETE' });
}
