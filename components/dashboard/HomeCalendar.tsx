'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCalendarFeed } from '@/lib/api/calendar';
import { formatUkDate, formatUkLongDate, formatUkMonthYear } from '@/lib/date';

type FeedEvent = {
  id: string;
  date: string;
  title: string;
  event_type?: string;
  start_time?: string | null;
};

type CalView = 'month' | 'week' | 'day';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(d: Date, n: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

/** Monday of the week containing `d`. */
function startOfWeek(d: Date) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - offset);
  return copy;
}

function eventTone(type?: string) {
  if (type === 'holiday') return 'bg-rose-500 text-white';
  if (type === 'leave') return 'bg-amber-500 text-white';
  if (type === 'meeting') return 'bg-violet-500 text-white';
  if (type === 'company_event') return 'bg-teal-500 text-white';
  if (type === 'training') return 'bg-indigo-500 text-white';
  if (type === 'deadline') return 'bg-orange-500 text-white';
  return 'bg-blue-500 text-white';
}

export function HomeCalendar() {
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<CalView>('month');
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const range = useMemo(() => {
    if (view === 'day') {
      const key = ymd(cursor);
      return { startDate: key, endDate: key };
    }
    if (view === 'week') {
      const start = startOfWeek(cursor);
      return { startDate: ymd(start), endDate: ymd(addDays(start, 6)) };
    }
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { startDate, endDate };
  }, [view, year, month, cursor]);

  const { data } = useQuery({
    queryKey: ['dashboard-calendar', view, range.startDate, range.endDate],
    queryFn: () => getCalendarFeed({ start_date: range.startDate, end_date: range.endDate }),
  });

  const eventsByDate = useMemo(() => {
    const map: Record<string, FeedEvent[]> = {};
    for (const ev of (data?.data || []) as FeedEvent[]) {
      const key = String(ev.date || '').slice(0, 10);
      if (!key) continue;
      (map[key] ||= []).push(ev);
    }
    return map;
  }, [data]);

  const monthCells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startPad = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const total = Math.ceil((startPad + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const dayNum = i - startPad + 1;
      if (dayNum < 1 || dayNum > daysInMonth) return null;
      return new Date(year, month, dayNum);
    });
  }, [year, month]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const today = ymd(new Date());

  const heading =
    view === 'day'
      ? formatUkLongDate(ymd(cursor))
      : view === 'week'
        ? `${formatUkDate(range.startDate)} – ${formatUkDate(range.endDate)}`
        : formatUkMonthYear(range.startDate);

  const goPrev = () => {
    if (view === 'day') setCursor(addDays(cursor, -1));
    else if (view === 'week') setCursor(addDays(cursor, -7));
    else setCursor(new Date(year, month - 1, 1));
  };

  const goNext = () => {
    if (view === 'day') setCursor(addDays(cursor, 1));
    else if (view === 'week') setCursor(addDays(cursor, 7));
    else setCursor(new Date(year, month + 1, 1));
  };

  const renderEventChip = (ev: FeedEvent) => (
    <p
      key={ev.id}
      title={ev.title}
      className={`truncate rounded px-1 py-[1px] text-[10px] leading-tight ${eventTone(ev.event_type)}`}
    >
      {ev.start_time ? `${String(ev.start_time).slice(0, 5)} ` : ''}
      {ev.title}
    </p>
  );

  return (
    <div className="flex h-full min-h-[560px] flex-col rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_10px_28px_rgba(37,99,235,0.08)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-blue-50 via-violet-50 to-teal-50 px-3 py-2">
        <h2 className="text-lg font-semibold text-blue-800">My Calendar</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={goPrev} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="min-w-[160px] text-center text-sm font-medium">{heading}</p>
          <Button size="icon-sm" variant="ghost" onClick={goNext} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="ml-1 flex rounded-lg border border-border p-0.5">
            {(['month', 'week', 'day'] as CalView[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-md px-2.5 py-1 text-xs capitalize ${
                  view === v ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-white'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'day' ? (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {(eventsByDate[ymd(cursor)] || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No events on this day.</p>
          ) : (
            (eventsByDate[ymd(cursor)] || []).map((ev) => (
              <div key={ev.id} className={`rounded-lg px-3 py-2 text-sm ${eventTone(ev.event_type)}`}>
                <p className="font-medium">{ev.title}</p>
                {ev.start_time ? <p className="text-xs opacity-90">{String(ev.start_time).slice(0, 5)}</p> : null}
              </div>
            ))
          )}
        </div>
      ) : view === 'week' ? (
        <>
          <div className="grid grid-cols-7 border-b border-border pb-2 text-center text-xs font-medium text-muted-foreground">
            {weekDays.map((date) => (
              <div key={ymd(date)}>
                {WEEKDAYS[(date.getDay() + 6) % 7]}
                <span className="mt-0.5 block text-sm text-foreground">{date.getDate()}</span>
              </div>
            ))}
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-7">
            {weekDays.map((date) => {
              const key = ymd(date);
              const isToday = key === today;
              const events = eventsByDate[key] || [];
              return (
                <div
                  key={key}
                  className={`min-h-[280px] overflow-hidden border-r border-border/60 p-1 last:border-r-0 ${
                    isToday ? 'bg-gradient-to-b from-sky-100 to-blue-50' : 'bg-card'
                  }`}
                >
                  <div className="space-y-0.5">
                    {events.map(renderEventChip)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-7 border-b border-border pb-2 text-center text-xs font-medium text-muted-foreground">
            {WEEKDAYS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
            {monthCells.map((date, i) => {
              if (!date) {
                return <div key={`empty-${i}`} className="border-b border-r border-border/60 bg-muted/20" />;
              }
              const key = ymd(date);
              const isToday = key === today;
              const events = eventsByDate[key] || [];
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => {
                    setCursor(date);
                    setView('day');
                  }}
                  className={`min-h-[84px] overflow-hidden border-b border-r border-border/60 p-1 text-left ${
                    isToday ? 'bg-gradient-to-b from-sky-100 to-blue-50' : 'bg-card'
                  }`}
                >
                  <p
                    className={`mb-1 text-right text-xs ${
                      isToday ? 'font-semibold text-sky-700' : 'text-muted-foreground'
                    }`}
                  >
                    {date.getDate()}
                  </p>
                  <div className="space-y-0.5">
                    {events.slice(0, 3).map(renderEventChip)}
                    {events.length > 3 ? (
                      <p className="text-[10px] text-muted-foreground">+{events.length - 3} more</p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
