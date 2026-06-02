import { apiRequest } from '@/lib/api/client';
import { decideLeave } from '@/lib/api/hr/leaves';

export type TeamAttendanceRow = {
  user_id: string;
  employee_id: string | null;
  full_name: string | null;
  email: string;
  department: string | null;
  designation: string | null;
  employment_type: string | null;
  work_mode: string | null;
  reporting_manager_name: string | null;
  total_hours: number;
  days_present: number;
  leave_paid_days: number;
  leave_unpaid_days: number;
  leave_lop_days: number;
  pending_leave_count: number;
};

export type TeamLeave = {
  id: string;
  requested_by: string;
  employee_id: string | null;
  start_date: string;
  end_date: string;
  reason: string | null;
  leave_type: string;
  status: string;
  requester_name?: string;
  requester_employee_id?: string | null;
};

export async function getHrTeamAttendance(month?: string) {
  const q = month ? `?month=${month}` : '';
  return apiRequest(`/hr/attendance/team${q}`) as Promise<{
    month: string;
    employees: TeamAttendanceRow[];
    leaves: TeamLeave[];
    pending_leaves: TeamLeave[];
    holidays: Array<{ id: string; date: string; title: string; holiday_pay_type: string | null }>;
  }>;
}

export type DayMarker =
  | 'present'
  | 'absent'
  | 'paid_leave'
  | 'unpaid_leave'
  | 'lop'
  | 'paid_holiday'
  | 'unpaid_holiday'
  | 'pending_paid'
  | 'pending_unpaid'
  | 'pending_lop'
  | 'leave_rejected';

export type EmployeeDayAttendance = {
  date: string;
  weekday: string;
  markers: string[];
  hours: number;
  sessions: Array<{ id: string; clock_in: string; clock_out: string | null; notes: string | null }>;
  holiday: { id: string; title: string; holiday_pay_type: string } | null;
  leave: {
    id: string;
    leave_type: string;
    status: string;
    start_date: string;
    end_date: string;
    reason: string | null;
  } | null;
};

export async function getHrEmployeeAttendance(userId: string, month?: string) {
  const q = month ? `?month=${month}` : '';
  return apiRequest(`/hr/attendance/employee/${userId}${q}`) as Promise<{
    month: string;
    employee: {
      id: string;
      full_name: string | null;
      email: string;
      employee_id: string | null;
      department: string | null;
      designation: string | null;
      employment_type: string | null;
      work_mode: string | null;
      monthly_salary: number | null;
    };
    days: EmployeeDayAttendance[];
    summary: {
      total_hours: number;
      days_present: number;
      leave_paid_days: number;
      leave_unpaid_days: number;
      leave_lop_days: number;
      holiday_count: number;
    };
    holidays: Array<{ id: string; date: string; title: string; holiday_pay_type: string | null }>;
  }>;
}

export type AttendanceGridDay = { date: string; day: number; is_weekend: boolean };
export type AttendanceGridCell = { date: string; marker: string };
export type AttendanceGridEmployee = {
  user_id: string;
  employee_id: string | null;
  full_name: string;
  department: string | null;
  cells: AttendanceGridCell[];
};

export async function getAttendanceGrid(month?: string) {
  const q = month ? `?month=${month}` : '';
  return apiRequest(`/hr/attendance/grid${q}`) as Promise<{
    month: string;
    days: AttendanceGridDay[];
    employees: AttendanceGridEmployee[];
  }>;
}

export { decideLeave };
