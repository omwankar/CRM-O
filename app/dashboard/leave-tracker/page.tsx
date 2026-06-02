'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CalendarCheck, Loader2, Palmtree } from 'lucide-react';
import { getLeaveBalance, getMyAttendance } from '@/lib/api/leave';
import { getMyLeaveRequests } from '@/lib/api/clock';

const markerConfig: Record<string, { label: string; className: string }> = {
  present: { label: 'Present', className: 'bg-emerald-100 text-emerald-800' },
  absent: { label: 'Absent', className: 'bg-gray-100 text-gray-600' },
  paid_leave: { label: 'Paid leave', className: 'bg-blue-100 text-blue-800' },
  unpaid_leave: { label: 'Unpaid leave', className: 'bg-slate-100 text-slate-700' },
  lop: { label: 'LOP', className: 'bg-red-100 text-red-800' },
  paid_holiday: { label: 'Paid holiday', className: 'bg-purple-100 text-purple-800' },
  unpaid_holiday: { label: 'Unpaid holiday', className: 'bg-violet-100 text-violet-700' },
  pending_paid: { label: 'Pending paid', className: 'bg-amber-100 text-amber-800' },
  pending_unpaid: { label: 'Pending unpaid', className: 'bg-amber-100 text-amber-800' },
  pending_lop: { label: 'Pending LOP', className: 'bg-amber-100 text-amber-800' },
  leave_rejected: { label: 'Leave rejected', className: 'bg-gray-100 text-gray-500' },
};

function statusBadge(status: string) {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-800';
  if (status === 'rejected') return 'bg-red-100 text-red-800';
  return 'bg-amber-100 text-amber-800';
}

function formatTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function LeaveTrackerPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.toISOString().slice(0, 7));
  const year = Number(month.slice(0, 4)) || now.getFullYear();

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['leave-balance', year],
    queryFn: () => getLeaveBalance(year),
  });

  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['my-attendance', month],
    queryFn: () => getMyAttendance(month),
  });

  const { data: leavesData, isLoading: leavesLoading } = useQuery({
    queryKey: ['my-leave-requests'],
    queryFn: getMyLeaveRequests,
  });

  const leaves = leavesData?.data || [];
  const pending = leaves.filter((l) => l.status === 'pending');
  const monthLabel = new Date(`${month}-01`).toLocaleDateString([], { year: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarCheck className="w-8 h-8" />
            Leave Tracker
          </h1>
          <p className="text-muted-foreground">Your paid-leave balance, requests, and attendance.</p>
        </div>
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-44" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Annual allowance ({year})</p>
          <p className="text-2xl font-bold tabular-nums">
            {balanceLoading ? '—' : balance?.allowance ?? '—'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Paid leave used</p>
          <p className="text-2xl font-bold tabular-nums">{balanceLoading ? '—' : balance?.used ?? '—'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Remaining paid</p>
          <p className="text-2xl font-bold tabular-nums text-emerald-600">
            {balanceLoading ? '—' : balance?.remaining ?? '—'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Pending requests</p>
          <p className="text-2xl font-bold tabular-nums">{leavesLoading ? '—' : pending.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Palmtree className="w-5 h-5" />
            My leave requests
          </h2>
          {leavesLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : leaves.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave requests yet.</p>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {leaves.map((l) => (
                <li key={l.id} className="text-sm border rounded-lg p-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-medium">
                      {l.start_date} → {l.end_date}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusBadge(l.status)}`}>
                      {l.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        l.leave_type === 'paid' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {l.leave_type === 'lop' ? 'LOP' : l.leave_type}
                    </span>
                    {typeof l.working_days === 'number' && (
                      <span className="text-xs text-muted-foreground">
                        {l.working_days} working day{l.working_days === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                  {l.reason ? <p className="text-xs text-muted-foreground mt-1">{l.reason}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-3">Attendance summary · {monthLabel}</h2>
          {attendance?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Hours</p>
                <p className="text-xl font-bold tabular-nums">{attendance.summary.total_hours}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Days present</p>
                <p className="text-xl font-bold tabular-nums">{attendance.summary.days_present}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Paid leave</p>
                <p className="text-xl font-bold tabular-nums">{attendance.summary.leave_paid_days}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Unpaid / LOP</p>
                <p className="text-xl font-bold tabular-nums">
                  {attendance.summary.leave_unpaid_days} / {attendance.summary.leave_lop_days}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Holidays</p>
                <p className="text-xl font-bold tabular-nums">{attendance.summary.holiday_count}</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b bg-muted/30 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">My attendance · {monthLabel}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(markerConfig).map(([key, cfg]) => (
              <span key={key} className={`px-2 py-0.5 rounded-full ${cfg.className}`}>
                {cfg.label}
              </span>
            ))}
          </div>
        </div>

        {attendanceLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !attendance?.days?.length ? (
          <p className="p-8 text-center text-muted-foreground">No data</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Day</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Login</th>
                  <th className="text-left p-3">Logout</th>
                  <th className="text-right p-3">Hours</th>
                </tr>
              </thead>
              <tbody>
                {attendance.days.map((day) => (
                  <tr key={day.date} className="border-b hover:bg-muted/20 align-top">
                    <td className="p-3 font-medium whitespace-nowrap">{day.date}</td>
                    <td className="p-3 text-muted-foreground">{day.weekday}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {day.markers.map((m) => {
                          const cfg = markerConfig[m] || { label: m, className: 'bg-muted text-muted-foreground' };
                          return (
                            <span key={m} className={`text-xs px-2 py-0.5 rounded-full ${cfg.className}`}>
                              {cfg.label}
                            </span>
                          );
                        })}
                      </div>
                      {day.holiday && <p className="text-xs text-muted-foreground mt-1">{day.holiday.title}</p>}
                    </td>
                    <td className="p-3 text-xs whitespace-nowrap">
                      {day.sessions.length === 0 ? (
                        '—'
                      ) : (
                        <ul className="space-y-1">
                          {day.sessions.map((s) => (
                            <li key={s.id}>{formatTime(s.clock_in)}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="p-3 text-xs whitespace-nowrap">
                      {day.sessions.length === 0 ? (
                        '—'
                      ) : (
                        <ul className="space-y-1">
                          {day.sessions.map((s) => (
                            <li key={s.id}>{formatTime(s.clock_out)}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="p-3 text-right tabular-nums">{day.hours > 0 ? day.hours.toFixed(2) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
