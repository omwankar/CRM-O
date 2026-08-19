'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarCheck, Check, Loader2, Palmtree, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { getLeaveBalance, getMyAttendance, getAttendanceGrid } from '@/lib/api/leave';
import { getMyLeaveRequests } from '@/lib/api/clock';
import { decideLeave, getHrLeaves } from '@/lib/api/hr/leaves';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatUkTime, formatUkMonthYear, ukMonthKey } from '@/lib/date';

function statusBadge(status: string) {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-800';
  if (status === 'rejected') return 'bg-red-100 text-red-800';
  return 'bg-amber-100 text-amber-800';
}

// Solid, high-contrast codes used in the month grid cells (readable on dark theme).
const gridCellConfig: Record<string, { code: string; className: string; label: string }> = {
  present: { code: 'P', className: 'bg-emerald-600 text-white', label: 'Present' },
  absent: { code: 'A', className: 'bg-rose-600 text-white', label: 'Absent' },
  paid_leave: { code: 'PL', className: 'bg-sky-600 text-white', label: 'Paid leave' },
  unpaid_leave: { code: 'UL', className: 'bg-indigo-600 text-white', label: 'Unpaid leave' },
  lop: { code: 'X', className: 'bg-red-800 text-white', label: 'LOP' },
  paid_holiday: { code: 'H', className: 'bg-purple-600 text-white', label: 'Holiday (paid)' },
  unpaid_holiday: { code: 'h', className: 'bg-fuchsia-700 text-white', label: 'Holiday (unpaid)' },
  pending: { code: '?', className: 'bg-amber-500 text-black', label: 'Pending leave' },
  weekoff: { code: '·', className: 'bg-zinc-700 text-zinc-300', label: 'Week off' },
  none: { code: '', className: 'bg-muted/30 text-muted-foreground', label: '' },
};

const gridLegend = [
  'present',
  'absent',
  'paid_leave',
  'unpaid_leave',
  'lop',
  'paid_holiday',
  'unpaid_holiday',
  'pending',
  'weekoff',
];

function formatTime(iso: string | null) {
  if (!iso) return '—';
  return formatUkTime(iso);
}

export default function LeaveTrackerPage() {
  const [month, setMonth] = useState(ukMonthKey());
  const year = Number(month.slice(0, 4)) || new Date().getFullYear();
  const { role, isSuperAdmin } = useCurrentUser();
  const isManager = role === 'manager' || role === 'super_admin';
  const qc = useQueryClient();

  const {
    data: grid,
    isLoading: gridLoading,
    error: gridError,
  } = useQuery({
    queryKey: ['attendance-grid', month],
    queryFn: () => getAttendanceGrid(month),
    retry: false,
  });

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['leave-balance', year],
    queryFn: () => getLeaveBalance(year),
  });

  const { data: attendance } = useQuery({
    queryKey: ['my-attendance', month],
    queryFn: () => getMyAttendance(month),
  });

  const { data: leavesData, isLoading: leavesLoading } = useQuery({
    queryKey: ['my-leave-requests'],
    queryFn: getMyLeaveRequests,
  });

  const { data: teamPendingData, isLoading: teamPendingLoading } = useQuery({
    queryKey: ['hr-pending-leaves'],
    queryFn: () => getHrLeaves({ status: 'pending' }),
    enabled: isSuperAdmin,
  });

  const decideMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      decideLeave(id, status),
    onSuccess: () => {
      toast.success('Leave updated');
      qc.invalidateQueries({ queryKey: ['hr-pending-leaves'] });
      qc.invalidateQueries({ queryKey: ['my-leave-requests'] });
      qc.invalidateQueries({ queryKey: ['hr-team-attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance-grid'] });
      qc.invalidateQueries({ queryKey: ['leave-balance'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const leaves = leavesData?.data || [];
  const pending = leaves.filter((l) => l.status === 'pending');
  const teamPending = teamPendingData?.data || [];
  const monthLabel = formatUkMonthYear(`${month}-01`);

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
          <p className="text-xs text-muted-foreground">
            {isSuperAdmin ? 'Team pending approvals' : 'Pending requests'}
          </p>
          <p className="text-2xl font-bold tabular-nums">
            {isSuperAdmin
              ? teamPendingLoading
                ? '—'
                : teamPending.length
              : leavesLoading
                ? '—'
                : pending.length}
          </p>
        </Card>
      </div>

      {isSuperAdmin ? (
        <Card className="p-5 border-amber-500/30">
          <h2 className="text-lg font-semibold mb-3">Leave approvals</h2>
          {teamPendingLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : teamPending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending leave requests.</p>
          ) : (
            <ul className="space-y-2">
              {teamPending.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 text-sm border rounded-lg p-3">
                  <div>
                    <p className="font-medium">
                      {l.requester_name || 'Employee'} · {l.start_date} → {l.end_date}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {l.leave_type === 'lop' ? 'LOP' : l.leave_type || 'leave'}
                      {l.reason ? ` · ${l.reason}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={decideMutation.isPending}
                      onClick={() => decideMutation.mutate({ id: l.id, status: 'approved' })}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={decideMutation.isPending}
                      onClick={() => decideMutation.mutate({ id: l.id, status: 'rejected' })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

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
          <p className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            {isManager ? `Team attendance grid · ${monthLabel}` : `My attendance · ${monthLabel}`}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {gridLegend.map((key) => {
              const cfg = gridCellConfig[key];
              return (
                <span key={key} className="inline-flex items-center gap-1">
                  <span
                    className={`inline-flex h-5 w-6 items-center justify-center rounded-sm text-[10px] font-bold ${cfg.className}`}
                  >
                    {cfg.code}
                  </span>
                  {cfg.label}
                </span>
              );
            })}
          </div>
        </div>

        {gridLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : gridError ? (
          <p className="p-8 text-center text-rose-600 text-sm">
            Couldn&apos;t load the grid: {gridError instanceof Error ? gridError.message : 'Unknown error'}
          </p>
        ) : !grid?.employees?.length || !grid?.days?.length ? (
          <p className="p-8 text-center text-muted-foreground">No employees</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="text-sm border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-muted/60 text-left p-2 min-w-[180px] border-b">
                    Employee
                  </th>
                  {grid.days.map((d) => (
                    <th
                      key={d.date}
                      className={`p-1 min-w-[52px] text-center text-xs font-medium border-b ${
                        d.is_weekend ? 'bg-muted/50 text-muted-foreground' : 'bg-muted/30'
                      }`}
                    >
                      {d.day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.employees.map((emp) => (
                  <tr key={emp.user_id} className="hover:bg-muted/10">
                    <td className="sticky left-0 z-10 bg-background p-2 border-b">
                      <p className="font-medium truncate max-w-[160px]">{emp.full_name}</p>
                      {emp.employee_id && (
                        <p className="text-[10px] text-muted-foreground font-mono">{emp.employee_id}</p>
                      )}
                    </td>
                    {emp.cells.map((c) => {
                      const cfg = gridCellConfig[c.marker] || gridCellConfig.none;
                      const session = c.sessions[0];
                      const tooltip = [
                        `${c.date} · ${cfg.label || '—'}`,
                        session ? `In: ${formatTime(session.clock_in)}` : null,
                        session ? `Out: ${formatTime(session.clock_out)}` : null,
                        c.hours > 0 ? `${c.hours}h` : null,
                      ]
                        .filter(Boolean)
                        .join('\n');
                      return (
                        <td key={c.date} className="p-0.5 text-center border-b align-top">
                          <div
                            title={tooltip}
                            className="flex flex-col items-center gap-0.5 min-h-[52px] py-0.5"
                          >
                            <span
                              className={`inline-flex h-5 w-6 items-center justify-center rounded-sm text-[10px] font-bold ${cfg.className}`}
                            >
                              {cfg.code}
                            </span>
                            {session ? (
                              <>
                                <span className="text-[9px] leading-tight text-emerald-400 tabular-nums">
                                  {formatTime(session.clock_in)}
                                </span>
                                <span className="text-[9px] leading-tight text-sky-400 tabular-nums">
                                  {formatTime(session.clock_out)}
                                </span>
                              </>
                            ) : null}
                          </div>
                        </td>
                      );
                    })}
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
