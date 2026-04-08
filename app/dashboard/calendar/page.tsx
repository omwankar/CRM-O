'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import { Calendar } from '@/components/ui/calendar';
import { AlertCircle, CalendarDays, PlusCircle, Users } from 'lucide-react';
import { supabase } from '@/lib/auth';

type CalendarEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  event_type: 'holiday' | 'meeting';
  start_time: string | null;
  end_time: string | null;
  description: string | null;
};

type EventsResponse = {
  ok: boolean;
  month: string;
  events: CalendarEvent[];
};

function formatMonthKey(d: Date) {
  // YYYY-MM in local time so it matches the DayPicker month selection.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function addMonths(d: Date, delta: number) {
  const copy = new Date(d.getTime());
  copy.setMonth(copy.getMonth() + delta);
  return copy;
}

function dateStrToLocalDate(dateStr: string) {
  // dateStr is YYYY-MM-DD
  const [y, m, d] = dateStr.split('-').map((x) => Number(x));
  // Use local midnight so DayPicker selection doesn't shift by timezone.
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function formatIsoDate(dateStr: string) {
  const dt = dateStrToLocalDate(dateStr);
  return dt.toLocaleDateString([], { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatYMDLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const monthKey = useMemo(() => formatMonthKey(monthDate), [monthDate]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const selectedDayKey = selectedDay ? formatMonthKey(selectedDay).slice(0, 7) + '-' + String(selectedDay.getUTCDate()).padStart(2, '0') : '';

  const [role, setRole] = useState<string | null>(null);

  const [addTitle, setAddTitle] = useState('');
  const [addType, setAddType] = useState<'holiday' | 'meeting'>('holiday');
  const [addDate, setAddDate] = useState('');
  const [addStartTime, setAddStartTime] = useState('');
  const [addEndTime, setAddEndTime] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/calendar/events?month=${encodeURIComponent(monthKey)}`, {
        method: 'GET',
        credentials: 'include',
      });
      const payload = (await res.json().catch(() => ({}))) as EventsResponse;
      if (!res.ok) throw new Error(payload?.error || 'Failed to load events');
      setEvents(payload.events || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey]);

  useEffect(() => {
    // fetch role for admin controls
    const loadRole = async () => {
      try {
        const userRes = await supabase.auth.getUser();
        const user = userRes.data.user;
        if (!user) return;
        const { data: roleRow } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        setRole(roleRow?.role ?? null);
      } catch {
        // ignore - calendar still works without admin form
      }
    };
    loadRole();
  }, []);

  useEffect(() => {
    // Default add date to selected day within current month.
    if (!selectedDay) return;
    const y = selectedDay.getFullYear();
    const m = selectedDay.getMonth() + 1;
    const d = selectedDay.getDate();
    setAddDate(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }, [selectedDay]);

  const selectedEvents = useMemo(() => {
    if (!selectedDay) return [];
    const ymd = formatYMDLocal(selectedDay);
    return events.filter((ev) => ev.date === ymd);
  }, [events, selectedDay]);

  const monthLabel = new Date(`${monthKey}-01T00:00:00`).toLocaleDateString([], { year: 'numeric', month: 'long' });

  const canEdit = role === 'super_admin' || role === 'admin';

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: addDate,
          title: addTitle,
          event_type: addType,
          start_time: addStartTime || undefined,
          end_time: addEndTime || undefined,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || 'Failed to add event');

      setAddTitle('');
      setAddStartTime('');
      setAddEndTime('');
      await fetchEvents();
    } catch (e: any) {
      setError(e?.message || 'Failed to add event');
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">Holidays and scheduled meetings.</p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setMonthDate((d) => addMonths(d, -1))}>
            Prev
          </Button>
          <Button variant="outline" onClick={() => setMonthDate((d) => addMonths(d, 1))}>
            Next
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{monthLabel}</p>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/15 p-4 text-sm text-destructive flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Proportional responsive layout: calendar + event list (left), admin form (right) */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="surface-card p-5 lg:col-span-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Month View</h2>
            </div>
            <p className="text-sm text-muted-foreground">Select a date to see events</p>
          </div>

          {/* Force calendar to take available width */}
          <div className="w-full overflow-x-auto">
            <Calendar
              className="w-full max-w-none"
              month={monthDate}
              mode="single"
              selected={selectedDay}
              onSelect={(d) => setSelectedDay(d ?? undefined)}
              onMonthChange={(m) => setMonthDate(m ?? monthDate)}
              modifiers={{
                hasEvents: events.map((ev) => dateStrToLocalDate(ev.date)),
              }}
              modifiersClassNames={{
                hasEvents: 'bg-primary/15 text-primary',
              }}
            />
          </div>

          {selectedDay && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Events: {formatIsoDate(formatYMDLocal(selectedDay))}</h3>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : selectedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events for this day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((ev) => (
                    <div key={ev.id} className="rounded-lg border border-border/70 bg-muted/20 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium">{ev.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {ev.event_type === 'holiday' ? 'Holiday' : 'Meeting'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {ev.start_time ? `Start ${ev.start_time}` : '—'}
                        {ev.end_time ? ` • End ${ev.end_time}` : ''}
                      </p>
                      {ev.description ? <p className="text-sm mt-1">{ev.description}</p> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="surface-card p-5 lg:col-span-4">
          <h2 className="text-lg font-semibold mb-3">Admin</h2>
          <p className="text-sm text-muted-foreground mb-4">Only admins can add holidays and meetings.</p>

          {canEdit ? (
            <form onSubmit={handleAddEvent} className="space-y-4">
              <FieldGroup>
                <FieldLabel>Date</FieldLabel>
                <Input
                  type="date"
                  value={addDate}
                  onChange={(e) => setAddDate(e.target.value)}
                  required
                />
              </FieldGroup>
              <FieldGroup>
                <FieldLabel>Title</FieldLabel>
                <Input
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  required
                  placeholder="e.g. National Holiday"
                />
              </FieldGroup>
              <FieldGroup>
                <FieldLabel>Type</FieldLabel>
                <select
                  className="h-10 rounded-lg border border-border/70 bg-background px-3"
                  value={addType}
                  onChange={(e) => setAddType(e.target.value as any)}
                >
                  <option value="holiday">Holiday</option>
                  <option value="meeting">Meeting</option>
                </select>
              </FieldGroup>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FieldGroup>
                  <FieldLabel>Start time</FieldLabel>
                  <Input
                    type="time"
                    value={addStartTime}
                    onChange={(e) => setAddStartTime(e.target.value)}
                  />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>End time</FieldLabel>
                  <Input type="time" value={addEndTime} onChange={(e) => setAddEndTime(e.target.value)} />
                </FieldGroup>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </form>
          ) : (
            <div className="text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Users className="w-4 h-4" /> You do not have permission to add events.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

