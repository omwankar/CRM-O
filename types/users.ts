export interface CRMUser {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'operations' | 'sales';
  department: string | null;
  phone: string | null;
  is_active: boolean;
  last_login: string | null;
  invited_by: string | null;
  invited_at: string | null;
  created_at: string;
}

export interface InviteUserInput {
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'operations' | 'sales';
  department?: string;
  phone?: string;
}

export interface EditUserInput {
  full_name?: string;
  role?: 'admin' | 'manager' | 'operations' | 'sales';
  department?: string;
  phone?: string;
  is_active?: boolean;
}
