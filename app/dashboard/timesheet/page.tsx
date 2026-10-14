'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, Loader2, MessageSquare, Send, Trash2 } from 'lucide-react';
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
  const { isSuperAdmin, isManager, user, isLoading: userLoading } = useCurrentUser();
  const isReviewer = isSuperAdmin || isManager;
  const [month, setMonth] = useState(ukMonthKey());
  const [employeeId, setEmployeeId] = useState('all');
  const [logDate, setLogDate] = useState(todayYmd());
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: usersData } = useQuery({
    queryKey: ['timesheet-users'],
    queryFn: () => getUsers({ limit: 200, is_active: 'true' }),
    enabled: isReviewer,
  });

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['timesheet', month, isReviewer ? employeeId : 'me'],
    queryFn: () =>
      getTimeLogs({
        month,
        user_id: isReviewer && employeeId !== 'all' ? employeeId : undefined,
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

  const dateGroups = useMemo(() => {
    const byDate = new Map<string, TimeLog[]>();
    for (const log of logs) {
      const dayKey = String(log.log_date).slice(0, 10);
      const day = byDate.get(dayKey) || [];
      day.push(log);
      byDate.set(dayKey, day);
    }
    return Array.from(byDate.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, entries]) => ({ date, entries }));
  }, [logs]);

  const peopleCount = useMemo(() => new Set(logs.map((log) => log.user_id)).size, [logs]);
  const canPost = !isReviewer || employeeId === 'all' || employeeId === user?.id;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Timesheet</h1>
          <p className="text-sm text-muted-foreground">
            {isReviewer
              ? `${logs.length} updates · ${peopleCount} ${peopleCount === 1 ? 'person' : 'people'}`
              : 'What you worked on. Comments stay tucked behind the icon.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isReviewer ? (
            <select
              className="h-9 rounded-md border bg-white px-2 text-sm"
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
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="h-9 w-auto" />
        </div>
      </div>

      {canPost ? (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-white p-2">
          <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="h-9 w-auto" />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you do?"
            className="h-9 min-h-9 flex-1 resize-none py-2"
          />
          <Input type="number" min="0" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="h" className="h-9 w-14" title="Hours" />
          <Input type="number" min="0" max="59" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="m" className="h-9 w-14" title="Minutes" />
          <Button size="sm" className="h-9 bg-teal-600 hover:bg-teal-700" onClick={() => createMut.mutate()} disabled={createMut.isPending}>
            {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
        </div>
      ) : dateGroups.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">No updates this month.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white">
          {dateGroups.map((day) => (
            <div key={day.date}>
              <div className="flex items-center gap-2 border-b bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                <span>{formatUkDate(day.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                <span className="text-slate-400">{day.entries.length}</span>
              </div>
              {day.entries.map((entry) => {
                const spent = formatHours(entry.duration_minutes);
                const mine = entry.user_id === user?.id;
                const commentCount = (entry.comments || []).length;
                const open = openId === entry.id;
                return (
                  <div key={entry.id} className="border-b last:border-b-0">
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      {isReviewer ? (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-semibold text-teal-800">
                          {initials(entry.user_name)}
                        </span>
                      ) : null}
                      {isReviewer ? (
                        <span className="w-28 shrink-0 truncate text-xs font-medium text-slate-700">{entry.user_name}</span>
                      ) : null}
                      <p className="min-w-0 flex-1 truncate text-sm text-slate-800" title={entry.description}>
                        {entry.description}
                      </p>
                      {spent ? (
                        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-slate-500">
                          <Clock className="h-3 w-3" />
                          {spent}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        className="inline-flex h-7 shrink-0 items-center gap-0.5 rounded-md px-1.5 text-violet-700 hover:bg-violet-50"
                        onClick={() => setOpenId(open ? null : entry.id)}
                        aria-label="Comments"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {commentCount > 0 ? <span className="text-[10px]">{commentCount}</span> : null}
                      </button>
                      {mine || isSuperAdmin ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => deleteMut.mutate(entry.id)}
                          aria-label="Remove entry"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        </Button>
                      ) : null}
                    </div>
                    {open ? (
                      <div className="space-y-2 border-t bg-slate-50/80 px-3 py-2">
                        {(entry.comments || []).length === 0 ? (
                          <p className="text-xs text-muted-foreground">No comments yet.</p>
                        ) : (
                          (entry.comments || []).map((c) => (
                            <div key={c.id} className="flex gap-2 text-sm">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="bg-violet-100 text-[9px] text-violet-800">
                                  {initials(c.author_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-xs">
                                  <span className="font-medium text-slate-800">{c.author_name}</span>
                                  <span className="ml-2 text-[11px] text-muted-foreground">{formatUkDateTime(c.created_at)}</span>
                                </p>
                                <p className="text-sm text-slate-700">{c.body}</p>
                              </div>
                            </div>
                          ))
                        )}
                        <div className="flex gap-2">
                          <Input
                            value={drafts[entry.id] || ''}
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                            placeholder={isReviewer && !mine ? 'Comment…' : 'Reply…'}
                            className="h-8"
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
                            className="h-8 bg-violet-600 hover:bg-violet-700"
                            disabled={commentMut.isPending || !(drafts[entry.id] || '').trim()}
                            onClick={() => {
                              const body = (drafts[entry.id] || '').trim();
                              if (body) commentMut.mutate({ id: entry.id, body });
                            }}
                          >
                            {commentMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Send'}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
