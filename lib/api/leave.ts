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
