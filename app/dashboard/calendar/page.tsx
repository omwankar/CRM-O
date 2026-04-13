'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import { AlertCircle, CalendarDays, PlusCircle, Users, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/auth';

type CalendarEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  event_type: 'holiday' | 'meeting' | 'leave';
  start_time: string | null;
  end_time: string | null;
  description: string | null;
};

type EventsResponse = {
  ok: boolean;
  month: string;
  events: CalendarEvent[];
  error?: string;
};

function formatMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function addMonths(d: Date, delta: number) {
  const copy = new Date(d.getTime());
  copy.setMonth(copy.getMonth() + delta);
  return copy;
}

function dateStrToLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map((x) => Number(x));
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
  const [monthCache, setMonthCache] = useState<Record<string, CalendarEvent[]>>({});

  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [role, setRole] = useState<string | null>(null);

  const [addTitle, setAddTitle] = useState('');
  const [addType, setAddType] = useState<'holiday' | 'meeting'>('holiday');
  const [addDate, setAddDate] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [myLeaveRequests, setMyLeaveRequests] = useState<any[]>([]);
  const [myLeaveLoading, setMyLeaveLoading] = useState(false);

  const fetchEvents = async (force = false) => {
    if (!force && monthCache[monthKey]) {
      setEvents(monthCache[monthKey]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/calendar/events?month=${encodeURIComponent(monthKey)}`, {
        method: 'GET',
        credentials: 'include',
      });
      const payload = (await res.json().catch(() => ({}))) as EventsResponse;
      if (!res.ok) throw new Error(payload?.error || 'Failed to load events');
      const nextEvents = payload.events || [];
      setEvents(nextEvents);
      setMonthCache((prev) => ({ ...prev, [monthKey]: nextEvents }));
    } catch (e: any) {
      setError(e?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [monthKey]);

  useEffect(() => {
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
    setAddLoading(true);
    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: addDate,
          title: addTitle,
          event_type: addType,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || 'Failed to add event');

      setAddTitle('');
      await fetchEvents(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to add event');
    } finally {
      setAddLoading(false);
    }
  };

  const eventMap = useMemo(() => {
    return events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
      if (!acc[ev.date]) acc[ev.date] = [];
      acc[ev.date].push(ev);
      return acc;
    }, {});
  }, [events]);

  const meetingDates = useMemo(
    () => events.filter((ev) => ev.event_type === 'meeting').map((ev) => dateStrToLocalDate(ev.date)),
    [events],
  );
  const holidayDates = useMemo(
    () => events.filter((ev) => ev.event_type === 'holiday').map((ev) => dateStrToLocalDate(ev.date)),
    [events],
  );
  const leaveDates = useMemo(
    () => events.filter((ev) => ev.event_type === 'leave').map((ev) => dateStrToLocalDate(ev.date)),
    [events],
  );

  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const yearOptions = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLeaveLoading(true);
    try {
      const res = await fetch('/api/calendar/leave-requests', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: leaveStartDate,
          end_date: leaveEndDate,
          reason: leaveReason || undefined,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || 'Failed to apply leave');

      setLeaveStartDate('');
      setLeaveEndDate('');
      setLeaveReason('');
      await loadMyLeaveRequests();
    } catch (e: any) {
      setError(e?.message || 'Failed to apply leave');
    } finally {
      setLeaveLoading(false);
    }
  };

  const loadMyLeaveRequests = async () => {
    setMyLeaveLoading(true);
    try {
      const res = await fetch('/api/calendar/leave-requests?scope=mine', {
        method: 'GET',
        credentials: 'include',
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok) {
        setMyLeaveRequests(payload.leave_requests || []);
      }
    } finally {
      setMyLeaveLoading(false);
    }
  };

  useEffect(() => {
    loadMyLeaveRequests();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <CalendarDays className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Calendar</h1>
          </div>
          <p className="text-base text-muted-foreground">Manage holidays and scheduled meetings for your organization.</p>
        </div>

        {/* Month Navigation */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 bg-card rounded-xl border border-border/50 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setMonthDate((d) => addMonths(d, -1))}
              className="h-10 w-10 p-0"
              disabled={loading || addLoading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setMonthDate((d) => addMonths(d, 1))}
              className="h-10 w-10 p-0"
              disabled={loading || addLoading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <h2 className="text-xl font-semibold">{monthLabel}</h2>
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-md border border-border/70 bg-background px-2 text-sm"
              value={monthDate.getMonth()}
              onChange={(e) =>
                setMonthDate(new Date(monthDate.getFullYear(), Number(e.target.value), 1))
              }
              disabled={loading || addLoading}
            >
              {monthOptions.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border border-border/70 bg-background px-2 text-sm"
              value={monthDate.getFullYear()}
              onChange={(e) =>
                setMonthDate(new Date(Number(e.target.value), monthDate.getMonth(), 1))
              }
              disabled={loading || addLoading}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow h-full">
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <CalendarDays className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold">Month View</h3>
              </div>

              {/* Calendar Component */}
              <div className="mb-8 bg-muted/40 rounded-lg p-4 overflow-x-auto">
                <Calendar
                  className="w-full max-w-none [--cell-size:2.3rem]"
                  month={monthDate}
                  mode="single"
                  selected={selectedDay}
                  onSelect={(d) => setSelectedDay(d ?? undefined)}
                  onMonthChange={(m) => setMonthDate(m ?? monthDate)}
                  modifiers={{
                    meetingDay: meetingDates,
                    holidayDay: holidayDates,
                    leaveDay: leaveDates,
                  }}
                  modifiersClassNames={{
                    meetingDay: 'bg-blue-100 text-blue-800 font-semibold',
                    holidayDay: 'bg-amber-100 text-amber-800 font-semibold',
                    leaveDay: 'bg-emerald-100 text-emerald-800 font-semibold',
                  }}
                  components={{
                    DayButton: (props: any) => {
                      const ymd = formatYMDLocal(props.day.date);
                      const dayEvents = eventMap[ymd] || [];
                      const firstMeeting = dayEvents.find((ev) => ev.event_type === 'meeting');
                      const hasHoliday = dayEvents.some((ev) => ev.event_type === 'holiday');
                      const hasLeave = dayEvents.some((ev) => ev.event_type === 'leave');

                      return (
                        <CalendarDayButton {...props}>
                          {props.children}
                          {firstMeeting ? (
                            <span className="max-w-[50px] truncate text-[9px] leading-none text-blue-700">
                              {firstMeeting.title}
                            </span>
                          ) : hasHoliday ? (
                            <span className="max-w-[50px] truncate text-[9px] leading-none text-amber-700">
                              Holiday
                            </span>
                          ) : hasLeave ? (
                            <span className="max-w-[50px] truncate text-[9px] leading-none text-emerald-700">
                              Leave
                            </span>
                          ) : null}
                        </CalendarDayButton>
                      );
                    },
                  }}
                />
              </div>

              {/* Events List for Selected Day */}
              {selectedDay && (
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    Events on {formatIsoDate(formatYMDLocal(selectedDay))}
                  </h4>
                  {loading ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">Loading events…</p>
                  ) : selectedEvents.length === 0 ? (
                    <div className="text-center py-8 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">No events scheduled for this day</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedEvents.map((ev) => (
                        <div 
                          key={ev.id} 
                          className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-4 hover:border-primary/40 transition-all"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <p className="font-semibold text-foreground">{ev.title}</p>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              ev.event_type === 'holiday'
                                ? 'bg-amber-100 text-amber-700' 
                                : ev.event_type === 'meeting'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {ev.event_type === 'holiday'
                                ? '🎉 Holiday'
                                : ev.event_type === 'meeting'
                                  ? '📅 Meeting'
                                  : '🟢 Approved Leave'}
                            </span>
                          </div>
                          {(ev.start_time || ev.end_time) && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {ev.start_time && <span>{ev.start_time}</span>}
                              {ev.start_time && ev.end_time && <span> — </span>}
                              {ev.end_time && <span>{ev.end_time}</span>}
                            </p>
                          )}
                          {ev.description && <p className="text-sm text-foreground/80">{ev.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Admin Form Card */}
          <Card className="border-border/50 shadow-sm h-full hover:shadow-md transition-shadow">
            <div className="p-6 sm:p-8">
              <h3 className="text-xl font-semibold mb-2">Add Event</h3>
              <p className="text-sm text-muted-foreground mb-6">Admin only. Create holidays and meetings.</p>

              {canEdit ? (
                <form onSubmit={handleAddEvent} className="space-y-5">
                  <FieldGroup>
                    <FieldLabel className="text-sm font-medium">Date</FieldLabel>
                    <Input
                      type="date"
                      value={addDate}
                      onChange={(e) => setAddDate(e.target.value)}
                      required
                      className="bg-muted/50 border-border/70"
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <FieldLabel className="text-sm font-medium">Title</FieldLabel>
                    <Input
                      value={addTitle}
                      onChange={(e) => setAddTitle(e.target.value)}
                      required
                      placeholder="e.g., Holiday or Meeting"
                      className="bg-muted/50 border-border/70"
                    />
                  </FieldGroup>

                  <FieldGroup>
                    <FieldLabel className="text-sm font-medium">Type</FieldLabel>
                    <select
                      className="h-10 w-full rounded-lg border border-border/70 bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={addType}
                      onChange={(e) => setAddType(e.target.value as any)}
                    >
                      <option value="holiday">🎉 Holiday</option>
                      <option value="meeting">📅 Meeting</option>
                    </select>
                  </FieldGroup>

                  <Button 
                    type="submit" 
                    className="w-full h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                    disabled={loading || addLoading}
                  >
                    {addLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        Add Event
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="rounded-lg bg-muted/40 border border-muted/70 p-4 text-center">
                  <div className="flex justify-center mb-2">
                    <Users className="w-8 h-8 text-muted-foreground/60" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Admin access required to add events.
                  </p>
                </div>
              )}

              <div className="mt-8 border-t border-border/60 pt-6">
                <h4 className="text-lg font-semibold mb-2">Apply Leave</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Employees can apply for leave. Requests are sent to Admin and Super Admin.
                  Only approved upcoming leaves appear on calendar.
                </p>
                <form onSubmit={handleApplyLeave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <FieldGroup>
                      <FieldLabel className="text-sm font-medium">Start Date</FieldLabel>
                      <Input
                        type="date"
                        value={leaveStartDate}
                        onChange={(e) => setLeaveStartDate(e.target.value)}
                        required
                        className="bg-muted/50 border-border/70"
                      />
                    </FieldGroup>
                    <FieldGroup>
                      <FieldLabel className="text-sm font-medium">End Date</FieldLabel>
                      <Input
                        type="date"
                        value={leaveEndDate}
                        onChange={(e) => setLeaveEndDate(e.target.value)}
                        required
                        className="bg-muted/50 border-border/70"
                      />
                    </FieldGroup>
                  </div>
                  <FieldGroup>
                    <FieldLabel className="text-sm font-medium">Reason (optional)</FieldLabel>
                    <Input
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      placeholder="Leave reason"
                      className="bg-muted/50 border-border/70"
                    />
                  </FieldGroup>
                  <Button type="submit" className="w-full" disabled={leaveLoading}>
                    {leaveLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Apply Leave'
                    )}
                  </Button>
                </form>
              </div>

              <div className="mt-8 border-t border-border/60 pt-6">
                <h4 className="text-lg font-semibold mb-2">My Leave Request Status</h4>
                {myLeaveLoading ? (
                  <p className="text-sm text-muted-foreground">Loading leave requests...</p>
                ) : myLeaveRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No leave requests yet.</p>
                ) : (
                  <div className="space-y-2">
                    {myLeaveRequests.map((lr) => (
                      <div
                        key={lr.id}
                        className="rounded-lg border border-border/70 bg-muted/20 p-3"
                      >
                        <p className="text-sm font-medium">
                          {lr.start_date} to {lr.end_date}
                        </p>
                        {lr.reason ? <p className="text-xs text-muted-foreground mt-1">{lr.reason}</p> : null}
                        <p className="text-xs mt-1">
                          Status:{' '}
                          <span
                            className={
                              lr.status === 'approved'
                                ? 'text-emerald-600 font-medium'
                                : lr.status === 'rejected'
                                  ? 'text-rose-600 font-medium'
                                  : 'text-amber-600 font-medium'
                            }
                          >
                            {lr.status}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
