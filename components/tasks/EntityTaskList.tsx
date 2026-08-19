'use client';

import { useMemo, useState } from 'react';
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
import { completeTask, createTask, deleteTask, getTasks } from '@/lib/api/tasks';
import { getUsers } from '@/lib/api/users';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatUkDate } from '@/lib/date';
import { TaskFilesComments } from '@/components/tasks/TaskFilesComments';
import {
  TASK_ENTITY_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type Task,
  type TaskEntityType,
  type TaskPriority,
} from '@/types/tasks';

function OverdueBadge({ task }: { task: Task }) {
  if (!task.overdue) return null;
  return (
    <Badge variant="outline" className="border-red-400/60 bg-red-500/10 text-red-800 dark:text-red-200">
      Overdue
    </Badge>
  );
}

/** Lightweight task list for entity detail pages (avoids bundling full TasksBoard). */
export function EntityTaskList({
  entityType,
  entityId,
  title = 'Tasks',
}: {
  entityType: TaskEntityType;
  entityId: string;
  title?: string;
}) {
  const { user, profile } = useCurrentUser();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<Task | null>(null);
  const [logActivity, setLogActivity] = useState(true);
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignee_id: '',
    due_date: new Date().toISOString().slice(0, 10),
    priority: 'medium' as TaskPriority,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', 'entity', entityType, entityId],
    queryFn: () =>
      getTasks({ view: 'entity', entity_type: entityType, entity_id: entityId, limit: 100 }),
    enabled: !!entityId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-task-picker'],
    queryFn: () => getUsers({ limit: 200, is_active: 'true' }),
    enabled: open,
  });

  const userList = useMemo(() => {
    const list = Array.isArray(users) ? users : (users as any)?.data || [];
    const arr = Array.isArray(list) ? [...list] : [];
    if (user?.id && !arr.some((u: any) => u.id === user.id)) {
      arr.unshift({
        id: user.id,
        full_name: profile?.full_name || user.email,
        email: user.email,
      });
    }
    return arr;
  }, [users, user, profile]);

  const createMut = useMutation({
    mutationFn: () =>
      createTask({
        title: form.title.trim(),
        description: form.description.trim() || null,
        entity_type: entityType,
        entity_id: entityId,
        assignee_id: form.assignee_id || user?.id || '',
        due_date: form.due_date,
        priority: form.priority,
      }),
    onSuccess: () => {
      toast.success('Task created');
      setOpen(false);
      setForm({
        title: '',
        description: '',
        assignee_id: user?.id || '',
        due_date: new Date().toISOString().slice(0, 10),
        priority: 'medium',
      });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const completeMut = useMutation({
    mutationFn: () =>
      completeTask(completeTarget!.id, {
        log_activity: logActivity && !!completeTarget?.entity_type,
        activity_type: 'note',
        activity_subject: completeTarget?.title || completeTarget?.task_title,
        activity_notes: completeTarget?.description || completeTarget?.notes,
      }),
    onSuccess: () => {
      toast.success(logActivity ? 'Task completed & activity logged' : 'Task completed');
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setForm((f) => ({ ...f, assignee_id: user?.id || '' }));
            setOpen(true);
          }}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add task
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading tasks…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tasks linked to this record.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((t) => (
            <li key={t.id}>
              <Card className="flex items-start gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{t.title || t.task_title}</p>
                    <Badge variant="secondary" className="text-xs">
                      {TASK_STATUS_LABELS[t.status] || t.status}
                    </Badge>
                    <OverdueBadge task={t} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Due {t.due_date ? formatUkDate(t.due_date) : '—'}
                    {t.assignee?.name || t.assigned_person?.name
                      ? ` · ${t.assignee?.name || t.assigned_person?.name}`
                      : ''}
                    {t.priority ? ` · ${TASK_PRIORITY_LABELS[t.priority]}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {t.status !== 'completed' && t.status !== 'cancelled' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      title="Complete"
                      onClick={() => {
                        setLogActivity(Boolean(t.entity_type));
                        setCompleteTarget(t);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      if (confirm('Delete this task?')) deleteMut.mutate(t.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
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
              {createMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!completeTarget} onOpenChange={(o) => !o && setCompleteTarget(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
              <span>
                Also log as an activity on this{' '}
                {TASK_ENTITY_LABELS[completeTarget.entity_type] || 'record'}?
              </span>
            </label>
          ) : (
            <p className="text-sm text-muted-foreground">
              Upload invoice folders if needed, then mark completed.
            </p>
          )}
          {completeTarget?.id ? (
            <TaskFilesComments taskId={completeTarget.id} showComments={false} />
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteTarget(null)}>
              Cancel
            </Button>
            <Button disabled={completeMut.isPending} onClick={() => completeMut.mutate()}>
              {completeMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
