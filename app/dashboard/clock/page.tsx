'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  getClockSessions,
  clockIn,
  clockOut,
  createMissedPunchRequest,
  getMyLeaveRequests,
  submitLeaveRequest,
} from '@/lib/api/clock';
import { getLeaveBalance } from '@/lib/api/leave';
import { Clock3, Loader2, MinusCircle, PlusCircle, Palmtree } from 'lucide-react';
import { toast } from 'sonner';

/** Weekday count (Mon-Fri) in an inclusive range. Holidays are additionally excluded by the server. */
function countWeekdays(start: string, end: string): number {
  if (!start || !end || end < start) return 0;
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  const cur = new Date(Date.UTC(sy, sm - 1, sd));
  const last = new Date(Date.UTC(ey, em - 1, ed));
  let count = 0;
  while (cur <= last) {
    const day = cur.getUTCDay();
    if (day !== 0 && day !== 6) count++;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return count;
}

function formatMonthKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function addMonths(d: Date, delta: number) {
  const copy = new Date(d.getTime());
  copy.setUTCMonth(copy.getUTCMonth() + delta);
  return copy;
}

function formatIsoTime(iso: string | null | undefined) {
  if (!iso) return '--';
  const dt = new Date(iso);
  return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatIsoDate(iso: string) {
  const dt = new Date(iso);
  return dt.toLocaleDateString([], { year: 'numeric', month: 'short', day: '2-digit' });
}

export default function ClockPage() {
  const queryClient = useQueryClient();
  const [monthDate, setMonthDate] = useState(() => new Date());
  const monthKey = useMemo(() => formatMonthKey(monthDate), [monthDate]);

  const [missedType, setMissedType] = useState<'clock_in' | 'clock_out'>('clock_in');
  const [missedReason, setMissedReason] = useState('');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['clock-sessions', monthKey],
    queryFn: () => getClockSessions(monthKey),
  });

  const clockInMutation = useMutation({
    mutationFn: () => clockIn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clock-sessions'] });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: () => clockOut(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clock-sessions'] });
    },
  });

  const missedPunchMutation = useMutation({
    mutationFn: (data: { type: 'clock_in' | 'clock_out'; requested_at: string; reason?: string }) => createMissedPunchRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clock-sessions'] });
      setMissedReason('');
    },
  });

  const { data: leavesData, isLoading: leavesLoading } = useQuery({
    queryKey: ['my-leave-requests'],
    queryFn: getMyLeaveRequests,
  });

  const { data: leaveBalance } = useQuery({
    queryKey: ['leave-balance', new Date().getFullYear()],
    queryFn: () => getLeaveBalance(),
  });

  const leaveMutation = useMutation({
    mutationFn: () =>
      submitLeaveRequest({
        start_date: leaveStart,
        end_date: leaveEnd,
        reason: leaveReason || undefined,
      }),
    onSuccess: () => {
      toast.success('Leave request submitted');
      setLeaveStart('');
      setLeaveEnd('');
      setLeaveReason('');
      queryClient.invalidateQueries({ queryKey: ['my-leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const requestWeekdays = countWeekdays(leaveStart, leaveEnd);
  const remainingPaid = leaveBalance?.remaining ?? 0;
  const willBePaid = requestWeekdays > 0 && requestWeekdays <= remainingPaid;

  const sessions = sessionsData?.sessions || [];
  const openSession = sessionsData?.openSession || null;

  const totalHours = sessions.reduce((acc: number, s: any) => {
    if (s.clock_out && s.clock_in) {
      const duration = (new Date(s.clock_out).getTime() - new Date(s.clock_in).getTime()) / 3600000;
      return acc + duration;
    }
    return acc;
  }, 0);

  const workDays = new Set(sessions.map((s: any) => new Date(s.clock_in).toDateString())).size;
  const missedPunchCount = sessionsData?.summary?.missedPunchCount || 0;

  const submitMissedPunch = (e: React.FormEvent) => {
    e.preventDefault();
    missedPunchMutation.mutate({
      type: missedType,
      requested_at: new Date().toISOString(),
      reason: missedReason || undefined,
    });
  };

  const monthLabel = new Date(`${monthKey}-01T00:00:00Z`).toLocaleDateString([], { year: 'numeric', month: 'long' });
  const todayLabel = new Date().toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    weekday: 'short',
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clock In/Out</h1>
          <p className="text-muted-foreground">Track time, work days, and missed punch requests.</p>
        </div>
        <Card className="px-4 py-2">
          <p className="text-xs text-muted-foreground">Today's Date</p>
          <p className="text-sm font-semibold">{todayLabel}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Clock3 className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-semibold">{totalHours.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <PlusCircle className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Work Days</p>
              <p className="text-2xl font-semibold">{workDays}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <MinusCircle className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Missed Punches</p>
              <p className="text-2xl font-semibold">{missedPunchCount}/5</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setMonthDate((d) => addMonths(d, -1))}>
            Prev
          </Button>
          <Button variant="outline" onClick={() => setMonthDate((d) => addMonths(d, 1))}>
            Next
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Month: {monthLabel}</p>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Sessions</h2>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>

        <div className="mb-4 rounded-lg border border-border/60 bg-muted/20 p-3 max-w-xl">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Today Action</p>
            {!openSession ? (
              <Button
                onClick={() => clockInMutation.mutate(undefined)}
                className="h-8 px-4"
                disabled={clockInMutation.isPending}
              >
                {clockInMutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Clocking in...
                  </span>
                ) : (
                  'Clock In'
                )}
              </Button>
            ) : (
              <Button
                onClick={() => clockOutMutation.mutate(undefined)}
                className="h-8 px-4"
                disabled={clockOutMutation.isPending}
              >
                {clockOutMutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Clocking out...
                  </span>
                ) : (
                  'Clock Out'
                )}
              </Button>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Open session: {openSession ? formatIsoDate(openSession.clock_in) : 'None'}
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions for this month.</p>
        ) : (
          <div className="space-y-2 max-w-3xl">
            {sessions.map((s: any) => {
              const durationMinutes =
                s.clock_out && s.clock_in ? (new Date(s.clock_out).getTime() - new Date(s.clock_in).getTime()) / 60000 : null;

              return (
                <div key={s.id} className="flex items-start justify-between rounded-xl border border-border/70 bg-muted/20 p-3">
                  <div>
                    <p className="font-medium text-sm">{formatIsoDate(s.clock_in)}</p>
                    <p className="text-xs text-muted-foreground">
                      In: {formatIsoTime(s.clock_in)} | Out: {formatIsoTime(s.clock_out)}
                    </p>
                    {s.notes ? <p className="text-xs mt-1">{s.notes}</p> : null}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-semibold text-sm">
                      {durationMinutes != null && durationMinutes >= 0 ? `${(durationMinutes / 60).toFixed(2)}h` : '--'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Palmtree className="w-5 h-5" />
            Request leave
          </h2>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!leaveStart || !leaveEnd) {
                toast.error('Select start and end dates');
                return;
              }
              leaveMutation.mutate();
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium block mb-1">From</label>
                <Input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">To</label>
                <Input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} required />
              </div>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Paid leave remaining ({new Date().getFullYear()})</span>
                <span className="font-semibold">
                  {leaveBalance ? `${leaveBalance.remaining} / ${leaveBalance.allowance}` : '—'}
                </span>
              </div>
              {requestWeekdays > 0 && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">
                    {requestWeekdays} working day{requestWeekdays === 1 ? '' : 's'} (weekends &amp; holidays excluded)
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      willBePaid ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {willBePaid ? 'Will be PAID' : 'Will be UNPAID'}
                  </span>
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Paid/unpaid is decided automatically from your remaining balance. Once it runs out, leave is unpaid.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Reason</label>
              <Input value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Optional" />
            </div>
            <Button type="submit" className="w-full" disabled={leaveMutation.isPending}>
              {leaveMutation.isPending ? 'Submitting...' : 'Submit leave request'}
            </Button>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold mb-3">My leave requests</h2>
          {leavesLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (leavesData?.data || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave requests yet.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {(leavesData?.data || []).map((l) => (
                <li key={l.id} className="text-sm border rounded-lg p-3">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {l.start_date} → {l.end_date}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        l.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : l.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {l.leave_type === 'lop' ? 'LOP' : l.leave_type} leave
                    {l.reason ? ` · ${l.reason}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-semibold mb-3">Missed Punch Request</h2>
        <p className="text-sm text-muted-foreground mb-4">
          If your clock-in/out time exceeded the allowed window, submit a missed punch request to your head.
          Max 5 requests per month.
        </p>

        <form onSubmit={submitMissedPunch} className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="text-sm font-medium mb-1 block">Request Type</label>
            <select
              className="h-10 rounded-lg border border-border/70 bg-background px-3 w-full"
              value={missedType}
              onChange={(e) => setMissedType(e.target.value as any)}
            >
              <option value="clock_in">Clock In</option>
              <option value="clock_out">Clock Out</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="text-sm font-medium mb-1 block">Reason (optional)</label>
            <Input
              value={missedReason}
              onChange={(e) => setMissedReason(e.target.value)}
              placeholder="e.g. traveled late due to..."
            />
          </div>
          <div className="md:col-span-1 flex items-end">
            <Button type="submit" className="w-full" disabled={missedPunchMutation.isPending}>
              {missedPunchMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

