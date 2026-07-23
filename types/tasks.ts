export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskEntityType =
  | 'lead'
  | 'opportunity'
  | 'enquiry'
  | 'quotation'
  | 'buyer'
  | 'vendor'
  | 'job'
  | 'project'
  | 'invoice'
  | 'contact'
  | 'company';

export type TaskView = 'mine' | 'sales' | 'operations' | 'finance' | 'team' | 'entity';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const TASK_ENTITY_LABELS: Record<TaskEntityType, string> = {
  lead: 'Lead',
  opportunity: 'Opportunity',
  enquiry: 'Enquiry',
  quotation: 'Quotation',
  buyer: 'Buyer',
  vendor: 'Vendor',
  job: 'Job / Shipment',
  project: 'Project',
  invoice: 'Invoice',
  contact: 'Contact',
  company: 'Company',
};

export const SALES_ENTITY_TYPES: TaskEntityType[] = [
  'lead',
  'opportunity',
  'enquiry',
  'quotation',
  'buyer',
  'contact',
  'company',
];

export const OPS_ENTITY_TYPES: TaskEntityType[] = ['job', 'project', 'vendor'];
export const FINANCE_ENTITY_TYPES: TaskEntityType[] = ['invoice'];

export interface TaskPerson {
  id: string;
  name: string;
  email: string;
}

export interface Task {
  id: string;
  task_id: string;
  title: string;
  task_title?: string;
  description: string | null;
  notes?: string | null;
  entity_type: TaskEntityType | null;
  entity_id: string | null;
  project_id?: string | null;
  assignee_id: string | null;
  assigned_person_id?: string | null;
  supervisor_id: string | null;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  completed_at: string | null;
  converted_to_activity_id: string | null;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  overdue?: boolean;
  assignee?: TaskPerson | null;
  assigned_person?: TaskPerson | null;
  supervisor?: TaskPerson | null;
  creator?: TaskPerson | null;
  project?: { id: string; project_id: string; project_name: string } | null;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  entity_type?: TaskEntityType | null;
  entity_id?: string | null;
  assignee_id: string;
  supervisor_id?: string | null;
  due_date: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export interface TaskFilters {
  view?: TaskView;
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  overdue?: boolean;
  search?: string;
  entity_type?: TaskEntityType;
  entity_id?: string;
  assignee_id?: string;
  page?: number;
  limit?: number;
}

export interface TasksListResponse {
  data: Task[];
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
