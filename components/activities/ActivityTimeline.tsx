'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Phone, Mail, Users, StickyNote, Plus, Trash2, Loader2 } from 'lucide-react';
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
import { createActivity, deleteActivity, getActivities } from '@/lib/api/activities';
import {
  ACTIVITY_OUTCOME_LABELS,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPES_ORDER,
  CALL_OUTCOMES,
  type ActivityEntityType,
  type ActivityOutcome,
  type ActivityType,
} from '@/types/activities';

const TYPE_ICON: Record<ActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: StickyNote,
};

function formatDaysAgo(iso: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export function DaysSinceBadge({
  days,
  lastAt,
}: {
  days: number | null | undefined;
  lastAt?: string | null;
}) {
  if (days == null && !lastAt) {
    return <span className="text-xs text-muted-foreground">No activity</span>;
  }
  const d = days ?? 0;
  const tone =
    d >= 14
      ? 'border-red-400/50 bg-red-500/10 text-red-800 dark:text-red-200'
      : d >= 7
        ? 'border-amber-400/50 bg-amber-500/10 text-amber-900 dark:text-amber-200'
        : 'border-emerald-400/50 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200';
  return (
    <Badge variant="outline" className={tone} title={lastAt ? new Date(lastAt).toLocaleString() : undefined}>
      {d === 0 ? 'Active today' : `${d}d since activity`}
    </Badge>
  );
}

export function ActivityTimeline({
  entityType,
  entityId,
  title = 'Activity timeline',
  compact = false,
}: {
  entityType: ActivityEntityType;
  entityId: string;
  title?: string;
  compact?: boolean;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: 'call' as ActivityType,
    subject: '',
    notes: '',
    activity_date: new Date().toISOString().slice(0, 16),
    outcome: '' as '' | ActivityOutcome,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['activities', entityType, entityId],
    queryFn: () => getActivities({ entity_type: entityType, entity_id: entityId, limit: 100 }),
    enabled: !!entityId,
  });

  const createMut = useMutation({
    mutationFn: () =>
      createActivity({
        type: form.type,
        entity_type: entityType,
        entity_id: entityId,
        subject: form.subject.trim(),
        notes: form.notes.trim() || null,
        activity_date: form.activity_date
          ? new Date(form.activity_date).toISOString()
          : new Date().toISOString(),
        outcome: form.type === 'call' && form.outcome ? form.outcome : null,
      }),
    onSuccess: () => {
      toast.success('Activity logged');
      setOpen(false);
      setForm({
        type: 'call',
        subject: '',
        notes: '',
        activity_date: new Date().toISOString().slice(0, 16),
        outcome: '',
      });
      qc.invalidateQueries({ queryKey: ['activities', entityType, entityId] });
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['opportunities'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteActivity(id),
    onSuccess: () => {
      toast.success('Activity removed');
      qc.invalidateQueries({ queryKey: ['activities', entityType, entityId] });
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['opportunities'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = data?.data || [];

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="flex items-center justify-between gap-2">
        <h3 className={compact ? 'text-sm font-semibold' : 'font-semibold'}>{title}</h3>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Log activity
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading activities…</p>
      ) : rows.length === 0 ? (
        <Card className="p-4 text-sm text-muted-foreground">
          No activities yet. Log a call, email, meeting, or note.
        </Card>
      ) : (
        <ul className="space-y-2">
          {rows.map((a) => {
            const Icon = TYPE_ICON[a.type] || StickyNote;
            return (
              <li key={a.id}>
                <Card className="flex gap-3 p-3">
                  <div className="mt-0.5 rounded-md border bg-muted/40 p-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-sm">{a.subject}</p>
                      <Badge variant="secondary" className="text-xs">
                        {ACTIVITY_TYPE_LABELS[a.type]}
                      </Badge>
                      {a.outcome ? (
                        <Badge variant="outline" className="text-xs">
                          {ACTIVITY_OUTCOME_LABELS[a.outcome] || a.outcome}
                        </Badge>
                      ) : null}
                    </div>
                    {a.notes ? (
                      <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                        {a.notes}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(a.activity_date).toLocaleString()} · {formatDaysAgo(a.activity_date)}
                      {a.creator?.full_name ? ` · ${a.creator.full_name}` : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 shrink-0 p-0"
                    onClick={() => {
                      if (confirm('Delete this activity?')) deleteMut.mutate(a.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log activity</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-1">
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as ActivityType, outcome: '' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES_ORDER.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ACTIVITY_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Subject *</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Intro call with ops manager"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>When</Label>
              <Input
                type="datetime-local"
                value={form.activity_date}
                onChange={(e) => setForm((f) => ({ ...f, activity_date: e.target.value }))}
              />
            </div>
            {form.type === 'call' ? (
              <div className="grid gap-1.5">
                <Label>Outcome</Label>
                <Select
                  value={form.outcome || 'none'}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      outcome: v === 'none' ? '' : (v as ActivityOutcome),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {CALL_OUTCOMES.map((o) => (
                      <SelectItem key={o} value={o}>
                        {ACTIVITY_OUTCOME_LABELS[o]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!form.subject.trim() || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              {createMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
