'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Timer, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getTimeLogs,
  createTimeLog,
  deleteTimeLog,
} from '@/lib/api/timelogs';
import { getTimelogReport } from '@/lib/api/reports';
import { getProjects } from '@/lib/api/projects';
import { getTasks } from '@/lib/api/tasks';
import type { TimeLog } from '@/types/workplace';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export default function TimeLogPage() {
  const qc = useQueryClient();
  const [month, setMonth] = useState(currentMonth());
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('');

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['timelogs', month],
    queryFn: () => getTimeLogs({ month }),
  });

  const { data: report } = useQuery({
    queryKey: ['timelog-report', month],
    queryFn: () => getTimelogReport(month),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['timelog-projects'],
    queryFn: () => getProjects({ limit: 200 }),
  });

  const { data: tasksData } = useQuery({
    queryKey: ['timelog-tasks'],
    queryFn: () => getTasks({ limit: 200 }),
  });

  const createMut = useMutation({
    mutationFn: () => {
      const duration = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
      if (duration <= 0) throw new Error('Enter a duration');
      if (!description.trim()) throw new Error('Enter a description');
      return createTimeLog({
        log_date: logDate,
        duration_minutes: duration,
        description: description.trim(),
        project_id: projectId || null,
        task_id: taskId || null,
      });
    },
    onSuccess: () => {
      toast.success('Time logged');
      setHours('');
      setMinutes('');
      setDescription('');
      setProjectId('');
      setTaskId('');
      qc.invalidateQueries({ queryKey: ['timelogs'] });
      qc.invalidateQueries({ queryKey: ['timelog-report'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTimeLog(id),
    onSuccess: () => {
      toast.success('Entry removed');
      qc.invalidateQueries({ queryKey: ['timelogs'] });
      qc.invalidateQueries({ queryKey: ['timelog-report'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const logs = (logsData?.data || []) as TimeLog[];
  const myRow = useMemo(() => {
    if (!report) return null;
    if (report.manager_view) return report.rows.reduce(
      (acc, r) => ({
        clocked_hours: acc.clocked_hours + r.clocked_hours,
        logged_hours: acc.logged_hours + r.logged_hours,
        idle_hours: acc.idle_hours + r.idle_hours,
      }),
      { clocked_hours: 0, logged_hours: 0, idle_hours: 0 },
    );
    return report.rows[0] || { clocked_hours: 0, logged_hours: 0, idle_hours: 0 };
  }, [report]);

  const projects = projectsData?.projects || [];
  const tasks = tasksData?.tasks || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Timer className="w-8 h-8 text-cyan-600" />
            Time Log
          </h1>
          <p className="text-muted-foreground">Log your work. Idle time is clocked hours minus logged hours.</p>
        </div>
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto" />
      </div>

      {myRow ? (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Clocked</p>
            <p className="text-2xl font-bold">{Math.round(myRow.clocked_hours * 10) / 10}h</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Logged</p>
            <p className="text-2xl font-bold">{Math.round(myRow.logged_hours * 10) / 10}h</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Idle</p>
            <p className="text-2xl font-bold text-amber-600">{Math.round(myRow.idle_hours * 10) / 10}h</p>
          </Card>
        </div>
      ) : null}

      <Card className="p-5">
        <h2 className="font-semibold mb-4">Log time</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div>
            <label className="text-xs font-medium block mb-1">Date</label>
            <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Hours</label>
            <Input type="number" min="0" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Minutes</label>
            <Input type="number" min="0" max="59" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="0" />
          </div>
          <div className="md:col-span-3">
            <label className="text-xs font-medium block mb-1">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What did you work on?" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium block mb-1">Project (optional)</label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.project_name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium block mb-1">Task (optional)</label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
            >
              <option value="">None</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.task_title}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex items-end">
            <Button className="w-full" onClick={() => createMut.mutate()} disabled={createMut.isPending}>
              {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Add entry
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold mb-4">Entries</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No entries this month.</p>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((l) => (
              <div key={l.id} className="flex items-center gap-4 py-3">
                <div className="w-24 shrink-0 text-sm font-medium">
                  {new Date(l.log_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                </div>
                <div className="w-20 shrink-0 text-sm text-muted-foreground">{formatHours(l.duration_minutes)}</div>
                <div className="flex-1 min-w-0 text-sm truncate">{l.description}</div>
                <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(l.id)}>
                  <Trash2 className="w-4 h-4 text-rose-600" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
