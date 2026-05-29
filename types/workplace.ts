export const ANNOUNCEMENT_CATEGORIES = [
  'birthday',
  'work_anniversary',
  'holiday',
  'general',
  'work_update',
] as const;
export type AnnouncementCategory = (typeof ANNOUNCEMENT_CATEGORIES)[number];

export const ANNOUNCEMENT_CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  birthday: 'Birthday',
  work_anniversary: 'Work Anniversary',
  holiday: 'Holiday',
  general: 'General',
  work_update: 'Work Update',
};

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  audience: 'all' | 'role' | 'users';
  audience_roles: string[];
  audience_user_ids: string[];
  is_pinned: boolean;
  publish_at: string;
  expires_at?: string | null;
  created_by?: string | null;
  author_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  category: AnnouncementCategory;
  audience?: 'all' | 'role' | 'users';
  audience_roles?: string[];
  audience_user_ids?: string[];
  is_pinned?: boolean;
  publish_at?: string;
  expires_at?: string | null;
}

export interface KbCategory {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  sort_order: number;
}

export interface KbArticleAttachment {
  id: string;
  article_id: string;
  file_name: string;
  storage_path: string;
  mime_type?: string | null;
  size_bytes?: number | null;
}

export interface KbArticleListItem {
  id: string;
  category_id?: string | null;
  title: string;
  slug: string;
  summary?: string | null;
  status: 'draft' | 'published';
  tags: string[];
  updated_at: string;
  published_at?: string | null;
}

export interface KbArticle extends KbArticleListItem {
  content: string;
  created_by?: string | null;
  updated_by?: string | null;
  attachments?: KbArticleAttachment[];
}

export interface CreateKbArticleInput {
  title: string;
  category_id?: string | null;
  summary?: string | null;
  content?: string;
  status?: 'draft' | 'published';
  tags?: string[];
}

export interface TimeLog {
  id: string;
  user_id: string;
  log_date: string;
  duration_minutes: number;
  description: string;
  started_at?: string | null;
  ended_at?: string | null;
  project_id?: string | null;
  task_id?: string | null;
  quotation_id?: string | null;
  created_at: string;
}

export interface CreateTimeLogInput {
  log_date: string;
  duration_minutes: number;
  description: string;
  project_id?: string | null;
  task_id?: string | null;
  quotation_id?: string | null;
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  event_type: 'holiday' | 'meeting' | 'company_event' | 'training' | 'deadline' | 'leave';
  start_time?: string | null;
  end_time?: string | null;
  description?: string | null;
  location?: string | null;
  all_day?: boolean;
  status?: 'active' | 'cancelled';
  holiday_pay_type?: 'paid' | 'unpaid' | null;
  creator?: { full_name?: string | null; email?: string | null } | null;
  is_leave?: boolean;
}

export interface CreateCalendarEventInput {
  date: string;
  title: string;
  event_type: 'holiday' | 'meeting' | 'company_event' | 'training' | 'deadline';
  start_time?: string | null;
  end_time?: string | null;
  description?: string | null;
  location?: string | null;
  all_day?: boolean;
  holiday_pay_type?: 'paid' | 'unpaid' | null;
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  holiday: 'Holiday',
  meeting: 'Meeting',
  company_event: 'Company Event',
  training: 'Training',
  deadline: 'Deadline',
  leave: 'Leave',
};
