import { apiRequest } from '@/lib/api/client';
import type { EmployeeDayAttendance } from '@/lib/api/hr/attendance';

export type LeaveBalance = {
  year: number;
  allowance: number;
  used: number;
  remaining: number;
};

export async function getLeaveBalance(year?: number) {
  const q = year ? `?year=${year}` : '';
  return apiRequest(`/clock/leave-balance${q}`) as Promise<LeaveBalance>;
}

export type MyAttendance = {
  month: string;
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
};

export async function getMyAttendance(month?: string) {
  const q = month ? `?month=${month}` : '';
  return apiRequest(`/clock/attendance/me${q}`) as Promise<MyAttendance>;
}

export type CompanyHoliday = {
  id: string;
  date: string;
  title: string;
  description: string | null;
  holiday_pay_type: 'paid' | 'unpaid' | null;
};

// Read-only holiday list, visible to every authenticated user
export async function getCompanyHolidays(year?: number) {
  const q = year ? `?year=${year}` : '';
  return apiRequest(`/clock/holidays${q}`) as Promise<{ data: CompanyHoliday[]; year: number }>;
}

// Monthly grid: employees (rows) x days (columns). Managers see the team; employees see their own row.
export type AttendanceGridDay = { date: string; day: number; is_weekend: boolean };
export type AttendanceGridCell = {
  date: string;
  marker: string;
  hours: number;
  sessions: Array<{ clock_in: string; clock_out: string | null }>;
};
export type AttendanceGridEmployee = {
  user_id: string;
  employee_id: string | null;
  full_name: string;
  department: string | null;
  cells: AttendanceGridCell[];
};

export type AttendanceGrid = {
  month: string;
  days: AttendanceGridDay[];
  employees: AttendanceGridEmployee[];
};

export async function getAttendanceGrid(month?: string) {
  const q = month ? `?month=${month}` : '';
  return apiRequest(`/clock/attendance-grid${q}`) as Promise<AttendanceGrid>;
}
