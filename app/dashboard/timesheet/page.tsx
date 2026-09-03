'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ClipboardList, Loader2, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  commentOnTimeLog,
  createTimeLog,
  deleteTimeLog,
  getTimeLogs,
} from '@/lib/api/timelogs';
import { getUsers } from '@/lib/api/users';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { TimeLog } from '@/types/workplace';
import { formatUkDate, formatUkDateTime, ukMonthKey } from '@/lib/date';

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function initials(name?: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatHours(minutes?: number) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h && !m) return null;
  if (!m) return `${h}h`;
  if (!h) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function TimesheetPage() {
  const qc = useQueryClient();
  const { isSuperAdmin, user, isLoading: userLoading } = useCurrentUser();
  const [month, setMonth] = useState(ukMonthKey());
  const [employeeId, setEmployeeId] = useState('all');
  const [logDate, setLogDate] = useState(todayYmd());
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const { data: usersData } = useQuery({
    queryKey: ['timesheet-users'],
    queryFn: () => getUsers({ limit: 200, is_active: 'true' }),
    enabled: isSuperAdmin,
  });

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['timesheet', month, isSuperAdmin ? employeeId : 'me'],
    queryFn: () =>
      getTimeLogs({
        month,
        user_id: isSuperAdmin && employeeId !== 'all' ? employeeId : undefined,
      }),
    enabled: !userLoading,
  });

  const createMut = useMutation({
    mutationFn: () => {
      if (!description.trim()) throw new Error('Write what you did today');
      const duration = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
      return createTimeLog({
        log_date: logDate,
        duration_minutes: duration,
        description: description.trim(),
      });
    },
    onSuccess: () => {
      toast.success('Timesheet updated');
      setDescription('');
      setHours('');
      setMinutes('');
      qc.invalidateQueries({ queryKey: ['timesheet'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const commentMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => commentOnTimeLog(id, body),
    onSuccess: (_data, vars) => {
      toast.success('Comment sent');
      setDrafts((prev) => ({ ...prev, [vars.id]: '' }));
      qc.invalidateQueries({ queryKey: ['timesheet'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTimeLog(id),
    onSuccess: () => {
      toast.success('Entry removed');
      qc.invalidateQueries({ queryKey: ['timesheet'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const employees = useMemo(() => {
    const list = Array.isArray(usersData) ? usersData : (usersData as any)?.data || [];
    return Array.isArray(list) ? list : [];
  }, [usersData]);

  const logs = (logsData?.data || []) as TimeLog[];

  const groups = useMemo(() => {
    const byPerson = new Map<string, { userId: string; name: string; days: Map<string, TimeLog[]> }>();
    for (const log of logs) {
      const personKey = log.user_id;
      if (!byPerson.has(personKey)) {
        byPerson.set(personKey, {
          userId: personKey,
          name: log.user_name || 'Employee',
          days: new Map(),
        });
      }
      const person = byPerson.get(personKey)!;
      const dayKey = String(log.log_date).slice(0, 10);
      const day = person.days.get(dayKey) || [];
      day.push(log);
      person.days.set(dayKey, day);
    }
    return Array.from(byPerson.values()).map((p) => ({
      userId: p.userId,
      name: p.name,
      days: Array.from(p.days.entries()).map(([date, entries]) => ({ date, entries })),
    }));
  }, [logs]);

  const canPost = !isSuperAdmin || employeeId === 'all' || employeeId === user?.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-teal-800">
            <ClipboardList className="h-8 w-8 text-teal-600" />
            Timesheet
          </p>
          <p className="text-sm text-muted-foreground">
            {isSuperAdmin
              ? 'Review what everyone did today and leave comments. Employees only see their own sheet.'
              : 'Write what you did today. Super Admins can review it and comment — you will get a notification.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isSuperAdmin ? (
            <select
              className="h-10 rounded-md border border-teal-200 bg-white px-3 text-sm"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="all">All employees</option>
              {employees.map((u: { id: string; full_name?: string; email?: string }) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </option>
              ))}
            </select>
          ) : null}
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto" />
        </div>
      </div>

      {canPost ? (
        <Card className="border-teal-100 bg-gradient-to-br from-teal-50 to-sky-50 p-5">
          <h2 className="mb-3 text-base font-semibold text-teal-900">What did you do today?</h2>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Calls made, work completed, follow-ups, blockers…"
            className="min-h-28 bg-white"
          />
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Date</label>
              <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Hours (optional)</label>
              <Input type="number" min="0" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="0" className="w-24" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Minutes</label>
              <Input type="number" min="0" max="59" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="0" className="w-24" />
            </div>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => createMut.mutate()} disabled={createMut.isPending}>
              {createMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Post update
            </Button>
          </div>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      ) : groups.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No timesheet updates this month.</Card>
      ) : (
        <div className="space-y-6">
          {groups.map((person) => (
            <div key={person.userId} className="space-y-3">
              {isSuperAdmin ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-teal-500 text-xs text-white">{initials(person.name)}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-lg font-semibold text-slate-800">{person.name}</h2>
                </div>
              ) : null}
              {person.days.map((day) => (
                <Card key={`${person.userId}-${day.date}`} className="border-blue-100 p-5">
                  <h3 className="mb-4 text-sm font-semibold text-blue-800">{formatUkDate(day.date, { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                  <div className="space-y-4">
                    {day.entries.map((entry) => {
                      const spent = formatHours(entry.duration_minutes);
                      const mine = entry.user_id === user?.id;
                      return (
                        <div key={entry.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="whitespace-pre-wrap text-sm text-slate-800">{entry.description}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatUkDateTime(entry.created_at)}
                                {spent ? ` · ${spent}` : ''}
                              </p>
                            </div>
                            {mine || isSuperAdmin ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteMut.mutate(entry.id)}
                                aria-label="Remove entry"
                              >
                                <Trash2 className="h-4 w-4 text-rose-500" />
                              </Button>
                            ) : null}
                          </div>

                          <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Comments</p>
                            {(entry.comments || []).length === 0 ? (
                              <p className="text-xs text-muted-foreground">No comments yet.</p>
                            ) : (
                              (entry.comments || []).map((c) => (
                                <div key={c.id} className="flex gap-2 rounded-lg bg-white p-2.5">
                                  <Avatar className="h-7 w-7">
                                    <AvatarFallback className="bg-violet-100 text-[10px] text-violet-800">
                                      {initials(c.author_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-xs font-medium text-violet-900">{c.author_name}</p>
                                    <p className="text-sm text-slate-700">{c.body}</p>
                                    <p className="text-[11px] text-muted-foreground">{formatUkDateTime(c.created_at)}</p>
                                  </div>
                                </div>
                              ))
                            )}
                            <div className="flex gap-2">
                              <Input
                                value={drafts[entry.id] || ''}
                                onChange={(e) => setDrafts((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                                placeholder={isSuperAdmin && !mine ? 'Comment for this employee…' : 'Reply…'}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    const body = (drafts[entry.id] || '').trim();
                                    if (body) commentMut.mutate({ id: entry.id, body });
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                className="bg-violet-600 hover:bg-violet-700"
                                disabled={commentMut.isPending || !(drafts[entry.id] || '').trim()}
                                onClick={() => {
                                  const body = (drafts[entry.id] || '').trim();
                                  if (body) commentMut.mutate({ id: entry.id, body });
                                }}
                              >
                                {commentMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
