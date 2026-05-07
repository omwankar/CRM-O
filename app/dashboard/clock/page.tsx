'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getClockSessions, clockIn, clockOut, createMissedPunchRequest } from '@/lib/api/clock';
import { Clock3, Loader2, MinusCircle, PlusCircle } from 'lucide-react';

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

