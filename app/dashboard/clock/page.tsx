'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
import { formatUkIsoDate, formatUkDate, formatUkTimeLabeled, formatUkMonthYear, formatUkDateTime } from '@/lib/date';

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

function formatMonthKeyFromDate(d: Date) {
  return formatUkIsoDate(d).slice(0, 7);
}

function addMonthsUk(monthKey: string, delta: number) {
  const [y, m] = monthKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1, 12));
  return formatMonthKeyFromDate(date);
}

function formatSessionTime(iso: string | null | undefined) {
  if (!iso) return '--';
  return formatUkTimeLabeled(iso);
}

function formatSessionDate(iso: string) {
  return formatUkDate(iso);
}

/** Interpret a calendar date + HH:MM as Europe/London and return UTC ISO. */
function ukDateTimeToIso(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcGuess));
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const londonAsUtc = Date.UTC(read('year'), read('month') - 1, read('day'), read('hour'), read('minute'), read('second'));
  return new Date(utcGuess - (londonAsUtc - utcGuess)).toISOString();
}

export default function ClockPage() {
  const queryClient = useQueryClient();
  const [monthKey, setMonthKey] = useState(() => formatMonthKeyFromDate(new Date()));
  const [ukNowLabel, setUkNowLabel] = useState('');

  const [punchDate, setPunchDate] = useState('');
  const [punchIn, setPunchIn] = useState('');
  const [punchOut, setPunchOut] = useState('');
  const [missedReason, setMissedReason] = useState('');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  useEffect(() => {
    const tick = () => setUkNowLabel(formatUkDateTime(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['clock-sessions', monthKey],
    queryFn: () => getClockSessions(monthKey),
  });

  const clockInMutation = useMutation({
    mutationFn: () => clockIn(),
    onSuccess: () => {
      toast.success('Clocked in');
      queryClient.invalidateQueries({ queryKey: ['clock-sessions'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to clock in'),
  });

  const clockOutMutation = useMutation({
    mutationFn: () => clockOut(),
    onSuccess: () => {
      toast.success('Clocked out');
      queryClient.invalidateQueries({ queryKey: ['clock-sessions'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to clock out'),
  });

  const missedPunchMutation = useMutation({
    mutationFn: (data: { clock_in: string; clock_out: string; reason?: string }) => createMissedPunchRequest(data),
    onSuccess: () => {
      toast.success('Missed punch request submitted');
      queryClient.invalidateQueries({ queryKey: ['clock-sessions'] });
      setPunchDate('');
      setPunchIn('');
      setPunchOut('');
      setMissedReason('');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to submit request'),
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

  const workDays = new Set(sessions.map((s: any) => formatUkIsoDate(s.clock_in))).size;
  const missedPunchCount = sessionsData?.summary?.missedPunchCount || 0;

  const submitMissedPunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!punchDate || !punchIn || !punchOut) {
      toast.error('Clock in and clock out are required');
      return;
    }
    const clockInIso = ukDateTimeToIso(punchDate, punchIn);
    const clockOutIso = ukDateTimeToIso(punchDate, punchOut);
    if (new Date(clockOutIso).getTime() <= new Date(clockInIso).getTime()) {
      toast.error('Clock out must be after clock in');
      return;
    }
    missedPunchMutation.mutate({
      clock_in: clockInIso,
      clock_out: clockOutIso,
      reason: missedReason || undefined,
    });
  };

  const monthLabel = formatUkMonthYear(`${monthKey}-01T12:00:00Z`);
  const todayLabel = formatUkDate(new Date(), {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    weekday: 'short',
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Clock In/Out</h1>
          <p className="text-muted-foreground">
            Clock in and clock out are required each working day. All times are UK (Europe/London).
          </p>
        </div>
        <Card className="px-4 py-2">
          <p className="text-xs text-muted-foreground">UK time now</p>
          <p className="text-sm font-semibold tabular-nums">{ukNowLabel || todayLabel}</p>
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
          <Button variant="outline" onClick={() => setMonthKey((m) => addMonthsUk(m, -1))}>
            Prev
          </Button>
          <Button variant="outline" onClick={() => setMonthKey((m) => addMonthsUk(m, 1))}>
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

        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/60 p-3 max-w-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Today <span className="text-amber-700">· required</span></p>
              <p className="text-xs text-muted-foreground">
                {openSession ? 'Clock out before you finish.' : 'Clock in to start the day.'}
              </p>
            </div>
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
            Open session: {openSession ? formatSessionDate(openSession.clock_in) : 'None'}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Session times shown in UK time.</p>
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
                    <p className="font-medium text-sm">{formatSessionDate(s.clock_in)}</p>
                    <p className="text-xs text-muted-foreground">
                      In: {formatSessionTime(s.clock_in)} | Out: {formatSessionTime(s.clock_out)}
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
                      {formatUkDate(l.start_date)} → {formatUkDate(l.end_date)}
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

      <Card className="p-4">
        <h2 className="text-base font-semibold">Missed punch</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Clock in and clock out are both required. Times are UK. Max 5 requests a month.
        </p>

        <form onSubmit={submitMissedPunch} className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs font-medium">Date <span className="text-rose-600">*</span></label>
            <Input type="date" value={punchDate} onChange={(e) => setPunchDate(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Clock in <span className="text-rose-600">*</span></label>
            <Input type="time" value={punchIn} onChange={(e) => setPunchIn(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Clock out <span className="text-rose-600">*</span></label>
            <Input type="time" value={punchOut} onChange={(e) => setPunchOut(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Reason</label>
            <Input
              value={missedReason}
              onChange={(e) => setMissedReason(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={missedPunchMutation.isPending}>
              {missedPunchMutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

