'use client';

import { useMemo, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { completeTask, createTask, deleteTask, getTasks, updateTask } from '@/lib/api/tasks';
import { getUsers } from '@/lib/api/users';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatUkDate } from '@/lib/date';
import {
  TASK_ENTITY_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type Task,
  type TaskEntityType,
  type TaskPriority,
  type TaskStatus,
  type TaskView,
} from '@/types/tasks';
import { EntityRecordPicker } from '@/components/tasks/EntityRecordPicker';

export { EntityTaskList } from '@/components/tasks/EntityTaskList';

function OverdueBadge({ task }: { task: Task }) {
  if (!task.overdue) return null;
  return (
    <Badge variant="outline" className="border-red-400/60 bg-red-500/10 text-red-800 dark:text-red-200">
      Overdue
    </Badge>
  );
}

export function TasksBoard({
  defaultView = 'mine',
  lockView,
}: {
  defaultView?: TaskView;
  lockView?: boolean;
}) {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const isManager = user?.role === 'manager' || user?.role === 'super_admin';

  const [view, setView] = useState<TaskView>(defaultView);
  const [status, setStatus] = useState<string>('all');
  const [priority, setPriority] = useState<string>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [open, setOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<Task | null>(null);
  const [logActivity, setLogActivity] = useState(true);

  const [form, setForm] = useState({
    title: '',
    description: '',
    entity_type: '' as '' | TaskEntityType,
    entity_id: '',
    entity_label: '',
    assignee_id: '',
    supervisor_id: '',
    due_date: new Date().toISOString().slice(0, 10),
    priority: 'medium' as TaskPriority,
  });

  const activeView = lockView ? defaultView : view;

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', activeView, status, priority, overdueOnly, debouncedSearch],
    queryFn: () =>
      getTasks({
        view: activeView,
        status: status as any,
        priority: priority as any,
        overdue: overdueOnly,
        search: debouncedSearch || undefined,
        limit: 100,
      }),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-tasks-board'],
    queryFn: () => getUsers(),
    enabled: open,
  });

  const userList = useMemo(() => {
    return Array.isArray(users) ? users : (users as any)?.data || [];
  }, [users]);

  const createMut = useMutation({
    mutationFn: () =>
      createTask({
        title: form.title.trim(),
        description: form.description.trim() || null,
        entity_type: form.entity_type || null,
        entity_id: form.entity_type && form.entity_id ? form.entity_id : null,
        assignee_id: form.assignee_id || user?.id || '',
        supervisor_id: form.supervisor_id || null,
        due_date: form.due_date,
        priority: form.priority,
      }),
    onSuccess: () => {
      toast.success('Task created');
      setOpen(false);
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status: s }: { id: string; status: TaskStatus }) => updateTask(id, { status: s }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const completeMut = useMutation({
    mutationFn: () =>
      completeTask(completeTarget!.id, {
        log_activity: logActivity && !!completeTarget?.entity_type,
        activity_type: 'note',
        activity_subject: completeTarget?.title || completeTarget?.task_title,
      }),
    onSuccess: () => {
      toast.success('Task completed');
      setCompleteTarget(null);
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      toast.success('Task deleted');
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = data?.data || data?.tasks || [];

  const viewTitle: Record<string, string> = {
    mine: 'Tasks',
    sales: 'Sales',
    operations: 'Operations',
    finance: 'Finance',
    team: 'Team',
  };

  const viewTabLabel: Record<string, string> = {
    mine: 'Mine',
    sales: 'Sales',
    operations: 'Operations',
    finance: 'Finance',
    team: 'Team',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{viewTitle[activeView] || 'Tasks'}</h1>
          <p className="mt-1 text-muted-foreground">
            All tasks in one place — overdue shown in red.
          </p>
        </div>
        <Button
          onClick={() => {
            setForm((f) => ({ ...f, assignee_id: user?.id || '' }));
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New task
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {!lockView ? (
          <>
            {(['mine', 'sales', 'operations', 'finance'] as TaskView[]).map((v) => (
              <Button
                key={v}
                size="sm"
                variant={activeView === v ? 'default' : 'outline'}
                onClick={() => setView(v)}
              >
                {viewTabLabel[v]}
              </Button>
            ))}
            {isManager ? (
              <Button
                size="sm"
                variant={activeView === 'team' ? 'default' : 'outline'}
                onClick={() => setView('team')}
              >
                Team
              </Button>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          className="max-w-xs"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {TASK_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {(Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map((p) => (
              <SelectItem key={p} value={p}>
                {TASK_PRIORITY_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant={overdueOnly ? 'default' : 'outline'}
          onClick={() => setOverdueOnly((v) => !v)}
        >
          Overdue only
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading tasks…</p>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">No tasks in this view.</Card>
      ) : (
        <div className="space-y-2">
          {rows.map((t) => (
            <Card key={t.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{t.title || t.task_title}</p>
                  <Badge variant="secondary">{TASK_STATUS_LABELS[t.status] || t.status}</Badge>
                  <OverdueBadge task={t} />
                  {t.entity_type ? (
                    <Badge variant="outline">{TASK_ENTITY_LABELS[t.entity_type]}</Badge>
                  ) : (
                    <Badge variant="outline">Standalone</Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Due {t.due_date ? formatUkDate(t.due_date) : '—'}
                  {' · '}
                  {t.assignee?.name || t.assigned_person?.name || 'Unassigned'}
                  {t.priority ? ` · ${TASK_PRIORITY_LABELS[t.priority]}` : ''}
                  {t.task_id ? ` · ${t.task_id}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {t.status !== 'completed' && t.status !== 'cancelled' ? (
                  <>
                    <Select
                      value={t.status}
                      onValueChange={(v) => statusMut.mutate({ id: t.id, status: v as TaskStatus })}
                    >
                      <SelectTrigger className="h-8 w-[140px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In progress</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={() => setCompleteTarget(t)}>
                      Complete
                    </Button>
                  </>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm('Delete this task?')) deleteMut.mutate(t.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Assignee *</Label>
              <Select
                value={form.assignee_id || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, assignee_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {userList.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Supervisor (optional)</Label>
              <Select
                value={form.supervisor_id || 'none'}
                onValueChange={(v) => setForm((f) => ({ ...f, supervisor_id: v === 'none' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {userList.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Due date *</Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm((f) => ({ ...f, priority: v as TaskPriority }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {TASK_PRIORITY_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Link to record (optional)</Label>
              <Select
                value={form.entity_type || 'none'}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    entity_type: v === 'none' ? '' : (v as TaskEntityType),
                    entity_id: '',
                    entity_label: '',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Standalone (no link)</SelectItem>
                  {(Object.keys(TASK_ENTITY_LABELS) as TaskEntityType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {TASK_ENTITY_LABELS[t]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {form.entity_type ? (
                <EntityRecordPicker
                  entityType={form.entity_type}
                  value={form.entity_id}
                  label={form.entity_label}
                  onChange={(id, label) =>
                    setForm((f) => ({ ...f, entity_id: id, entity_label: label }))
                  }
                />
              ) : null}
              <p className="text-[11px] text-muted-foreground">
                Search by name or number — or create the task from a record’s detail page to link it automatically.
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!form.title.trim() || !form.assignee_id || !form.due_date || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!completeTarget} onOpenChange={(o) => !o && setCompleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Complete task</DialogTitle>
          </DialogHeader>
          {completeTarget?.entity_type ? (
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={logActivity}
                onChange={(e) => setLogActivity(e.target.checked)}
              />
              <span>Log this as an activity on the linked record?</span>
            </label>
          ) : (
            <p className="text-sm text-muted-foreground">Mark completed.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteTarget(null)}>
              Cancel
            </Button>
            <Button onClick={() => completeMut.mutate()} disabled={completeMut.isPending}>
              Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
