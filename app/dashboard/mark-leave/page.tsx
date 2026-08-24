'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AccessDenied } from '@/components/AccessDenied';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getHrEmployees } from '@/lib/api/hr/employees';
import { assignEmployeeLeave, getHrLeaves } from '@/lib/api/hr/leaves';
import { formatUkDate } from '@/lib/date';
import { CalendarMinus, Loader2, Palmtree, Search } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

type LeaveKind = 'paid' | 'lop';

export default function MarkLeavePage() {
  const { role, isLoading: authLoading } = useCurrentUser();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveKind>('paid');
  const [reason, setReason] = useState('');

  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['hr-employees', search],
    queryFn: () => getHrEmployees({ search: search || undefined, limit: 100 }),
    enabled: role === 'super_admin',
  });

  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['hr-leaves-all'],
    queryFn: () => getHrLeaves({ scope: 'all' }),
    enabled: role === 'super_admin',
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      assignEmployeeLeave({
        user_id: userId,
        start_date: startDate,
        end_date: endDate || startDate,
        leave_type: leaveType,
        reason: reason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(leaveType === 'lop' ? 'Employee marked as LOP' : 'Employee marked as paid leave');
      setReason('');
      qc.invalidateQueries({ queryKey: ['hr-leaves-all'] });
      qc.invalidateQueries({ queryKey: ['hr-pending-leaves'] });
      qc.invalidateQueries({ queryKey: ['attendance-grid'] });
      qc.invalidateQueries({ queryKey: ['leave-balance'] });
      qc.invalidateQueries({ queryKey: ['my-leave-requests'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (authLoading) return <div className="p-8">Loading...</div>;
  if (role !== 'super_admin') return <AccessDenied />;

  const employees = employeesData?.data || [];
  const recent = (recentData?.data || [])
    .filter((l) => l.status === 'approved' && (l.leave_type === 'paid' || l.leave_type === 'lop'))
    .slice(0, 25);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Palmtree className="w-8 h-8" />
          Mark Leave
        </h1>
        <p className="text-muted-foreground">
          Super Admin can assign paid leave or LOP (Loss of Pay) to an employee. It is applied immediately
          on the attendance grid — no approval step.
        </p>
      </div>

      <Card className="p-6">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!userId) {
              toast.error('Select an employee');
              return;
            }
            if (!startDate) {
              toast.error('Choose a start date');
              return;
            }
            assignMutation.mutate();
          }}
        >
          <div>
            <label className="text-sm font-medium block mb-1">Find employee</label>
            <div className="relative max-w-md mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search name, email, or employee ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="w-full max-w-md h-10 rounded-md border bg-background px-3 text-sm"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            >
              <option value="">{employeesLoading ? 'Loading employees...' : 'Select employee'}</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name || emp.email}
                  {emp.employee_id ? ` · ${emp.employee_id}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Leave type</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
              <button
                type="button"
                onClick={() => setLeaveType('paid')}
                className={`rounded-lg border p-4 text-left transition ${
                  leaveType === 'paid'
                    ? 'border-sky-500 bg-sky-500/10 ring-1 ring-sky-500'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <p className="font-semibold">Paid leave</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Counts against the employee’s annual paid-leave balance. Shows as PL on the grid.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setLeaveType('lop')}
                className={`rounded-lg border p-4 text-left transition ${
                  leaveType === 'lop'
                    ? 'border-red-500 bg-red-500/10 ring-1 ring-red-500'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <p className="font-semibold">LOP (Loss of Pay)</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Unpaid absence. Does not use paid-leave balance. Shows as X on the grid.
                </p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <div>
              <label className="text-sm font-medium block mb-1">Start date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (!endDate || endDate < e.target.value) setEndDate(e.target.value);
                }}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">End date</label>
              <Input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="max-w-xl">
            <label className="text-sm font-medium block mb-1">Note (optional)</label>
            <Textarea
              rows={3}
              placeholder="Reason or payroll note..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={assignMutation.isPending}>
              {assignMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CalendarMinus className="w-4 h-4 mr-2" />
              )}
              {leaveType === 'lop' ? 'Mark as LOP' : 'Mark as paid leave'}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/leave-tracker">Open Leave Tracker</Link>
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-semibold mb-3">Recently marked paid leave / LOP</h2>
        {recentLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">None yet.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 text-sm border rounded-lg p-3">
                <div>
                  <p className="font-medium">
                    {l.requester_name || 'Employee'} · {formatUkDate(l.start_date)} → {formatUkDate(l.end_date)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {typeof l.working_days === 'number'
                      ? `${l.working_days} working day${l.working_days === 1 ? '' : 's'}`
                      : null}
                    {l.reason ? `${typeof l.working_days === 'number' ? ' · ' : ''}${l.reason}` : ''}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    l.leave_type === 'lop' ? 'bg-red-800 text-white' : 'bg-sky-600 text-white'
                  }`}
                >
                  {l.leave_type === 'lop' ? 'LOP' : 'Paid leave'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
