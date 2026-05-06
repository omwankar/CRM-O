export interface TaskEmployee {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'admin' | 'assigned' | 'viewer';
  avatar_initials: string;
  added_at: string;
}

export interface Task {
  id: string;
  task_id: string;
  task_title: string;
  task_type: 'admin' | 'sales';
  project_id?: string | null;
  assigned_person_id?: string | null;
  supervisor_id?: string | null;
  assigned_date: string | null;
  due_date: string | null;
  status: 'Pending' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  notes: string;
  linked_email: string | null;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_person?: { id: string; name: string; email: string };
  supervisor?: { id: string; name: string; email: string };
  project?: { id: string; project_id: string; project_name: string };
  employees?: TaskEmployee[];
  attachments?: TaskAttachment[];
  emails?: TaskEmail[];
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: number;
  uploaded_by: string | null;
  created_at: string;
}

export interface TaskEmail {
  id: string;
  task_id: string;
  email_id: string;
  subject: string;
  sender_name: string;
  sender_email: string;
  body_preview: string;
  full_body: string;
  received_at: string;
  is_read: boolean;
  created_at: string;
}

export interface TaskStatusHistory {
  id: string;
  old_status: string | null;
  new_status: string;
  reason: string;
  changed_by_name: string;
  changed_at: string;
}

export interface CreateTaskInput {
  task_title: string;
  task_type: 'admin' | 'sales';
  project_id?: string | null;
  assigned_person_id?: string | null;
  supervisor_id?: string | null;
  assigned_date?: string;
  due_date?: string;
  status?: 'Pending' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  notes?: string;
  linked_email?: string;
  created_by: string;
}

export interface UpdateTaskInput {
  task_title?: string;
  task_type?: 'admin' | 'sales';
  project_id?: string | null;
  assigned_person_id?: string | null;
  supervisor_id?: string | null;
  assigned_date?: string;
  due_date?: string;
  status?: 'Pending' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  notes?: string;
  linked_email?: string;
}

export interface ChangeTaskStatusInput {
  status: 'Pending' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  reason: string;
  changed_by?: string;
}

export interface AddTaskEmployeeInput {
  user_id: string;
  role: 'admin' | 'assigned' | 'viewer';
}

export interface TaskFilters {
  status?: 'Pending' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  task_type?: 'admin' | 'sales';
  project_id?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: 'created_at' | 'due_date' | 'assigned_date' | 'task_title';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TasksListResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type TaskStatus = 'Pending' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
export type TaskType = 'admin' | 'sales';
