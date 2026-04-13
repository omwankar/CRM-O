'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import { AlertCircle, Clock3, Loader2, MinusCircle, PlusCircle } from 'lucide-react';

type ClockSession = {
  id: string;
  clock_in: string;
  clock_out: string | null;
  notes: string | null;
};

type SessionsResponse = {
  ok: boolean;
  month: string;
  openSession: { id: string; clock_in: string } | null;
  sessions: ClockSession[];
  summary: {
    totalMinutes: number;
    totalHours: number;
    workDays: number;
    missedPunchCount: number;
  };
};

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
  const [monthDate, setMonthDate] = useState(() => new Date());
  const monthKey = useMemo(() => formatMonthKey(monthDate), [monthDate]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'clock_in' | 'clock_out' | null>(null);
  const [error, setError] = useState<string>('');
  const [sessions, setSessions] = useState<ClockSession[]>([]);
  const [openSession, setOpenSession] = useState<SessionsResponse['openSession']>(null);
  const [summary, setSummary] = useState<SessionsResponse['summary']>({
    totalMinutes: 0,
    totalHours: 0,
    workDays: 0,
    missedPunchCount: 0,
  });

  const [missedType, setMissedType] = useState<'clock_in' | 'clock_out'>('clock_in');
  const [missedReason, setMissedReason] = useState('');
  const [missedLoading, setMissedLoading] = useState(false);

  const fetchSessions = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError('');

    try {
      const res = await fetch(`/api/clock/sessions?month=${encodeURIComponent(monthKey)}`, {
        method: 'GET',
        credentials: 'include',
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Failed to load clock sessions');

      const data = payload as SessionsResponse;
      setSessions(data.sessions);
      setOpenSession(data.openSession);
      setSummary(data.summary);
    } catch (e: any) {
      setError(e?.message || 'Failed to load clock sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey]);

  const handleClockIn = async () => {
    setError('');
    setActionLoading('clock_in');
    try {
      const res = await fetch('/api/clock/clock-in', { method: 'POST', credentials: 'include' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Clock-in failed');
        return;
      }
      if (payload?.session) {
        setOpenSession({ id: payload.session.id, clock_in: payload.session.clock_in });
        setSessions((prev) => [payload.session, ...prev]);
      }
      fetchSessions(true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClockOut = async () => {
    setError('');
    setActionLoading('clock_out');
    try {
      const res = await fetch('/api/clock/clock-out', { method: 'POST', credentials: 'include' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Clock-out failed');
        return;
      }
      if (payload?.session) {
        setOpenSession(null);
        setSessions((prev) =>
          prev.map((s) => (s.id === payload.session.id ? { ...s, clock_out: payload.session.clock_out } : s)),
        );
      }
      fetchSessions(true);
    } finally {
      setActionLoading(null);
    }
  };

  const submitMissedPunch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMissedLoading(true);

    try {
      const res = await fetch('/api/clock/missed-punch', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: missedType, reason: missedReason || undefined }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Failed to submit missed punch');

      setMissedReason('');
      await fetchSessions(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to submit missed punch');
    } finally {
      setMissedLoading(false);
    }
  };

  const monthLabel = new Date(`${monthKey}-01T00:00:00Z`).toLocaleDateString([], { year: 'numeric', month: 'long' });
  const todayLabel = new Date().toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    weekday: 'short',
  });

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clock In/Out</h1>
          <p className="page-subtitle">Track time, work days, and missed punch requests.</p>
        </div>
        <Card className="surface-card px-4 py-2">
          <p className="text-xs text-muted-foreground">Today's Date</p>
          <p className="text-sm font-semibold">{todayLabel}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="surface-card p-5">
          <div className="flex items-center gap-3">
            <Clock3 className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-semibold">{summary.totalHours.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="surface-card p-5">
          <div className="flex items-center gap-3">
            <PlusCircle className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Work Days</p>
              <p className="text-2xl font-semibold">{summary.workDays}</p>
            </div>
          </div>
        </Card>
        <Card className="surface-card p-5">
          <div className="flex items-center gap-3">
            <MinusCircle className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Missed Punches</p>
              <p className="text-2xl font-semibold">{summary.missedPunchCount}/5</p>
            </div>
          </div>
        </Card>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/15 p-4 text-sm text-destructive flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
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

      <div className="mt-6">
        <Card className="surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Sessions</h2>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>

          <div className="mb-4 rounded-lg border border-border/60 bg-muted/20 p-3 max-w-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Today Action</p>
              {!openSession ? (
                <Button
                  onClick={handleClockIn}
                  className="h-8 px-4"
                  disabled={actionLoading !== null || loading}
                >
                  {actionLoading === 'clock_in' ? (
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
                  onClick={handleClockOut}
                  className="h-8 px-4"
                  disabled={actionLoading !== null || loading}
                >
                  {actionLoading === 'clock_out' ? (
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

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions for this month.</p>
          ) : (
            <div className="space-y-2 max-w-3xl">
              {sessions.map((s) => {
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
      </div>

      <Card className="surface-card p-5 mt-4">
        <h2 className="text-lg font-semibold mb-3">Missed Punch Request</h2>
        <p className="text-sm text-muted-foreground mb-4">
          If your clock-in/out time exceeded the allowed window, submit a missed punch request to your head.
          Max 5 requests per month.
        </p>

        <form onSubmit={submitMissedPunch} className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <FieldGroup>
              <FieldLabel>Request Type</FieldLabel>
              <select
                className="h-10 rounded-lg border border-border/70 bg-background px-3"
                value={missedType}
                onChange={(e) => setMissedType(e.target.value as any)}
              >
                <option value="clock_in">Clock In</option>
                <option value="clock_out">Clock Out</option>
              </select>
            </FieldGroup>
          </div>
          <div className="md:col-span-1">
            <FieldGroup>
              <FieldLabel htmlFor="reason">Reason (optional)</FieldLabel>
              <Input
                id="reason"
                value={missedReason}
                onChange={(e) => setMissedReason(e.target.value)}
                placeholder="e.g. traveled late due to..."
              />
            </FieldGroup>
          </div>
          <div className="md:col-span-1 flex items-end">
            <Button type="submit" className="w-full" disabled={missedLoading}>
              {missedLoading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

