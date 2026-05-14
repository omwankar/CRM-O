'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import { CalendarDays, PlusCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { getCalendarEvents, createCalendarEvent } from '@/lib/api/calendar';
import { useCurrentUser } from '@/hooks/useCurrentUser';

type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  event_type: 'holiday' | 'meeting' | 'leave';
  start_time: string | null;
  end_time: string | null;
  description: string | null;
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
  const queryClient = useQueryClient();
  const { canWrite } = useCurrentUser();
  const [monthDate, setMonthDate] = useState(() => new Date());
  const monthKey = useMemo(() => formatMonthKey(monthDate), [monthDate]);

  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [addTitle, setAddTitle] = useState('');
  const [addType, setAddType] = useState<'holiday' | 'meeting'>('holiday');
  const [addDate, setAddDate] = useState('');

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['calendar-events', monthKey],
    queryFn: () => {
      const [year, month] = monthKey.split('-');
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      return getCalendarEvents({ start_date: startDate, end_date: endDate });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: (data: { date: string; title: string; event_type: 'holiday' | 'meeting' }) => createCalendarEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setAddTitle('');
    },
  });

  const events = eventsData?.data || [];

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
    return events.filter((ev: CalendarEvent) => ev.date === ymd);
  }, [events, selectedDay]);

  const monthLabel = new Date(`${monthKey}-01T00:00:00`).toLocaleDateString([], { year: 'numeric', month: 'long' });

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    createEventMutation.mutate({
      date: addDate,
      title: addTitle,
      event_type: addType,
    });
  };

  const eventMap = useMemo(() => {
    return events.reduce((acc: Record<string, CalendarEvent[]>, ev: CalendarEvent) => {
      if (!acc[ev.date]) acc[ev.date] = [];
      acc[ev.date].push(ev);
      return acc;
    }, {});
  }, [events]);

  const meetingDates = useMemo(
    () => events.filter((ev: CalendarEvent) => ev.event_type === 'meeting').map((ev: CalendarEvent) => dateStrToLocalDate(ev.date)),
    [events],
  );
  const holidayDates = useMemo(
    () => events.filter((ev: CalendarEvent) => ev.event_type === 'holiday').map((ev: CalendarEvent) => dateStrToLocalDate(ev.date)),
    [events],
  );
  const leaveDates = useMemo(
    () => events.filter((ev: CalendarEvent) => ev.event_type === 'leave').map((ev: CalendarEvent) => dateStrToLocalDate(ev.date)),
    [events],
  );

  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const yearOptions = Array.from({ length: 7 }, (_: unknown, i: number) => new Date().getFullYear() - 3 + i);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <CalendarDays className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Calendar</h1>
          </div>
          <p className="text-base text-muted-foreground">Manage holidays and scheduled meetings for your organization.</p>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 bg-card rounded-xl border border-border/50 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setMonthDate((d) => addMonths(d, -1))}
              className="h-10 w-10 p-0"
              disabled={isLoading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setMonthDate((d) => addMonths(d, 1))}
              className="h-10 w-10 p-0"
              disabled={isLoading}
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
              disabled={isLoading}
            >
              {monthOptions.map((m: string, idx: number) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border border-border/70 bg-background px-2 text-sm"
              value={monthDate.getFullYear()}
              onChange={(e) =>
                setMonthDate(new Date(Number(e.target.value), monthDate.getMonth(), 1))
              }
              disabled={isLoading}
            >
              {yearOptions.map((y: number) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={`grid grid-cols-1 gap-6 ${canWrite ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow h-full">
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <CalendarDays className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold">Month View</h3>
              </div>

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
                      const firstMeeting = dayEvents.find((ev: CalendarEvent) => ev.event_type === 'meeting');
                      const hasHoliday = dayEvents.some((ev: CalendarEvent) => ev.event_type === 'holiday');
                      const hasLeave = dayEvents.some((ev: CalendarEvent) => ev.event_type === 'leave');

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

              {selectedDay && (
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    Events on {formatIsoDate(formatYMDLocal(selectedDay))}
                  </h4>
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">Loading events…</p>
                  ) : selectedEvents.length === 0 ? (
                    <div className="text-center py-8 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">No events scheduled for this day</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedEvents.map((ev: CalendarEvent) => (
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

          {canWrite && (
          <Card className="border-border/50 shadow-sm h-full hover:shadow-md transition-shadow">
            <div className="p-6 sm:p-8">
              <h3 className="text-xl font-semibold mb-2">Add Event</h3>
              <p className="text-sm text-muted-foreground mb-6">Create holidays and meetings.</p>

              <form onSubmit={handleAddEvent} className="space-y-5">
                <div>
                  <label className="text-sm font-medium mb-1 block">Date</label>
                  <Input
                    type="date"
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                    required
                    className="bg-muted/50 border-border/70"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Title</label>
                  <Input
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    required
                    placeholder="e.g., Holiday or Meeting"
                    className="bg-muted/50 border-border/70"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Type</label>
                  <select
                    className="h-10 w-full rounded-lg border border-border/70 bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={addType}
                    onChange={(e) => setAddType(e.target.value as any)}
                  >
                    <option value="holiday">🎉 Holiday</option>
                    <option value="meeting">📅 Meeting</option>
                  </select>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  disabled={isLoading || createEventMutation.isPending}
                >
                  {createEventMutation.isPending ? (
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
            </div>
          </Card>
          )}
        </div>
      </div>
    </div>
  );
}
