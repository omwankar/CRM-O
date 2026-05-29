'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CanWrite } from '@/components/auth/Can';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getCalendarFeed,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '@/lib/api/calendar';
import { EVENT_TYPE_LABELS, type CalendarEvent, type CreateCalendarEventInput } from '@/types/workplace';

const EVENT_TYPES: CreateCalendarEventInput['event_type'][] = [
  'holiday',
  'meeting',
  'company_event',
  'training',
  'deadline',
];

const TYPE_BADGE: Record<string, string> = {
  holiday: 'bg-emerald-100 text-emerald-800',
  meeting: 'bg-blue-100 text-blue-800',
  company_event: 'bg-violet-100 text-violet-800',
  training: 'bg-amber-100 text-amber-800',
  deadline: 'bg-rose-100 text-rose-800',
  leave: 'bg-slate-200 text-slate-700',
};

type EventForm = CreateCalendarEventInput & { id?: string };

const emptyForm: EventForm = {
  date: new Date().toISOString().slice(0, 10),
  title: '',
  event_type: 'company_event',
  start_time: '',
  end_time: '',
  description: '',
  location: '',
  all_day: true,
  holiday_pay_type: null,
};

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function EventManagerPage() {
  const qc = useQueryClient();
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);

  const month = monthKey(monthDate);
  const range = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const start = `${y}-${String(m).padStart(2, '0')}-01`;
    const end = `${y}-${String(m).padStart(2, '0')}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
    return { start, end };
  }, [month]);

  const { data, isLoading } = useQuery({
    queryKey: ['event-feed', month],
    queryFn: () => getCalendarFeed({ start_date: range.start, end_date: range.end }),
  });

  const events = (data?.data || []).slice().sort((a, b) => a.date.localeCompare(b.date));

  const saveMut = useMutation({
    mutationFn: () => {
      const payload: CreateCalendarEventInput = {
        date: form.date,
        title: form.title,
        event_type: form.event_type,
        start_time: form.all_day ? null : form.start_time || null,
        end_time: form.all_day ? null : form.end_time || null,
        description: form.description || null,
        location: form.location || null,
        all_day: form.all_day,
        holiday_pay_type: form.event_type === 'holiday' ? form.holiday_pay_type || null : null,
      };
      return form.id ? updateCalendarEvent(form.id, payload) : createCalendarEvent(payload);
    },
    onSuccess: () => {
      toast.success(form.id ? 'Event updated' : 'Event created');
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: ['event-feed'] });
      qc.invalidateQueries({ queryKey: ['calendar-events'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCalendarEvent(id),
    onSuccess: () => {
      toast.success('Event deleted');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['event-feed'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setForm({ ...emptyForm, date: `${month}-01` });
    setDialogOpen(true);
  };

  const openEdit = (ev: CalendarEvent) => {
    setForm({
      id: ev.id,
      date: ev.date,
      title: ev.title,
      event_type: (ev.event_type === 'leave' ? 'company_event' : ev.event_type) as EventForm['event_type'],
      start_time: ev.start_time || '',
      end_time: ev.end_time || '',
      description: ev.description || '',
      location: ev.location || '',
      all_day: ev.all_day ?? true,
      holiday_pay_type: ev.holiday_pay_type || null,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="w-8 h-8 text-blue-600" />
            Event Manager
          </h1>
          <p className="text-muted-foreground">Create and edit company events, meetings, holidays and deadlines.</p>
        </div>
        <CanWrite>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            New event
          </Button>
        </CanWrite>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="icon" onClick={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold">
            {monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No events this month.</p>
        ) : (
          <div className="divide-y divide-border">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center gap-4 py-3">
                <div className="w-24 shrink-0 text-sm">
                  <p className="font-medium">{new Date(ev.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</p>
                  {!ev.all_day && ev.start_time ? (
                    <p className="text-xs text-muted-foreground">{ev.start_time.slice(0, 5)}</p>
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${TYPE_BADGE[ev.event_type] || 'bg-slate-100 text-slate-700'}`}>
                      {EVENT_TYPE_LABELS[ev.event_type] || ev.event_type}
                    </span>
                    {ev.holiday_pay_type ? (
                      <Badge variant="outline" className="text-[10px]">{ev.holiday_pay_type}</Badge>
                    ) : null}
                  </div>
                  <p className="font-medium truncate mt-1">{ev.title}</p>
                  {ev.location ? <p className="text-xs text-muted-foreground truncate">{ev.location}</p> : null}
                </div>
                {!ev.is_leave ? (
                  <CanWrite>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(ev)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(ev)}>
                        <Trash2 className="w-4 h-4 text-rose-600" />
                      </Button>
                    </div>
                  </CanWrite>
                ) : (
                  <span className="text-xs text-muted-foreground shrink-0">Leave</span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit event' : 'New event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium block mb-1">Title</label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Date</label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Type</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.event_type}
                  onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value as EventForm['event_type'] }))}
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.all_day}
                onChange={(e) => setForm((f) => ({ ...f, all_day: e.target.checked }))}
              />
              All day
            </label>
            {!form.all_day && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Start time</label>
                  <Input type="time" value={form.start_time || ''} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">End time</label>
                  <Input type="time" value={form.end_time || ''} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} />
                </div>
              </div>
            )}
            {form.event_type === 'holiday' && (
              <div>
                <label className="text-sm font-medium block mb-1">Holiday pay</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.holiday_pay_type || ''}
                  onChange={(e) => setForm((f) => ({ ...f, holiday_pay_type: (e.target.value || null) as EventForm['holiday_pay_type'] }))}
                >
                  <option value="">Not set</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium block mb-1">Location</label>
              <Input value={form.location || ''} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Description</label>
              <Input value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!form.title.trim()) {
                  toast.error('Enter a title');
                  return;
                }
                saveMut.mutate();
              }}
              disabled={saveMut.isPending}
            >
              {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {form.id ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deleteTarget && (
        <AlertDialog open onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete event?</AlertDialogTitle>
              <AlertDialogDescription>
                &ldquo;{deleteTarget.title}&rdquo; will be removed from the calendar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={() => deleteMut.mutate(deleteTarget.id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
