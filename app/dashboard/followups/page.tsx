'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlarmClockCheck,
  AlarmClockOff,
  CalendarClock,
  CheckCircle2,
  History,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  deleteFollowUp,
  getFollowUpEvents,
  getFollowUps,
  getFollowUpSummary,
  updateFollowUp,
} from '@/lib/api/followups';
import {
  BUCKET_STYLES,
  EMAIL_STATUS_LABELS,
  ENTITY_TYPE_LABELS,
  FOLLOW_UP_TYPE_LABELS,
  followUpBucket,
  type FollowUp,
  type FollowUpBucket,
} from '@/types/followups';
import { FollowUpDialog } from '@/components/followups/FollowUpDialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatUkDateTime } from '@/lib/date';

const SUMMARY_CARDS: Array<{
  key: 'overdue' | 'due_today' | 'due_soon' | 'completed_this_month';
  bucket: FollowUpBucket;
  label: string;
  sub: string;
  card: string;
  number: string;
}> = [
  {
    key: 'overdue',
    bucket: 'overdue',
    label: 'Overdue',
    sub: 'Needs action now',
    card: 'border-red-200 bg-red-50 hover:border-red-400',
    number: 'text-red-600',
  },
  {
    key: 'due_today',
    bucket: 'today',
    label: 'Due today',
    sub: 'Do not miss these',
    card: 'border-orange-200 bg-orange-50 hover:border-orange-400',
    number: 'text-orange-600',
  },
  {
    key: 'due_soon',
    bucket: 'soon',
    label: 'Due soon',
    sub: 'Next 3 days',
    card: 'border-yellow-200 bg-yellow-50 hover:border-yellow-400',
    number: 'text-yellow-600',
  },
  {
    key: 'completed_this_month',
    bucket: 'completed',
    label: 'Completed',
    sub: 'This month',
    card: 'border-emerald-200 bg-emerald-50 hover:border-emerald-400',
    number: 'text-emerald-600',
  },
];

function typeIcon(t: FollowUp['follow_up_type']) {
  if (t === 'email') return <Mail className="h-3.5 w-3.5" />;
  if (t === 'call') return <Phone className="h-3.5 w-3.5" />;
  return <CalendarClock className="h-3.5 w-3.5" />;
}

export default function FollowUpsPage() {
  const qc = useQueryClient();
  const { role, user } = useCurrentUser();
  const privileged = role === 'super_admin' || role === 'manager';

  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [bucket, setBucket] = useState<FollowUpBucket>('pending');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FollowUp | null>(null);
  const [historyFor, setHistoryFor] = useState<FollowUp | null>(null);

  const effectiveScope = privileged ? scope : 'mine';

  const { data: summary } = useQuery({
    queryKey: ['followup-summary', effectiveScope],
    queryFn: () => getFollowUpSummary(effectiveScope),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['followups', effectiveScope, bucket],
    queryFn: () => getFollowUps({ scope: effectiveScope, bucket }),
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['followup-events', historyFor?.id],
    queryFn: () => getFollowUpEvents(historyFor!.id),
    enabled: !!historyFor,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['followups'] });
    qc.invalidateQueries({ queryKey: ['followup-summary'] });
    qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const completeMut = useMutation({
    mutationFn: (id: string) => updateFollowUp(id, { status: 'completed' }),
    onSuccess: () => {
      toast.success('Follow-up completed — well done');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reopenMut = useMutation({
    mutationFn: (id: string) => updateFollowUp(id, { status: 'pending' }),
    onSuccess: () => {
      toast.success('Follow-up reopened');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFollowUp(id),
    onSuccess: () => {
      toast.success('Follow-up deleted');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const list = data?.data || [];
    // Overdue first, then by due date
    return [...list].sort((a, b) => {
      const rank = (f: FollowUp) => {
        const bk = followUpBucket(f);
        return bk === 'overdue' ? 0 : bk === 'today' ? 1 : bk === 'soon' ? 2 : bk === 'upcoming' ? 3 : 4;
      };
      return rank(a) - rank(b) || new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
    });
  }, [data]);

  const canEdit = (f: FollowUp) => privileged || f.created_by === user?.id || f.assigned_to === user?.id;
  const canDelete = (f: FollowUp) => privileged || f.created_by === user?.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <AlarmClockCheck className="h-8 w-8 text-blue-600" />
            Follow-ups
          </h1>
          <p className="mt-1 text-muted-foreground">
            No lead, customer, or quotation gets forgotten. Overdue items stay visible until done.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          New follow-up
        </Button>
      </div>

      {/* Colored summary buckets */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_CARDS.map((c) => (
          <button key={c.key} type="button" onClick={() => setBucket(c.bucket)} className="text-left">
            <Card className={`p-4 transition-colors ${c.card} ${bucket === c.bucket ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</p>
              <p className={`text-3xl font-bold ${c.number}`}>{summary?.[c.key] ?? '—'}</p>
              <p className="text-xs text-muted-foreground">{c.sub}</p>
            </Card>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {privileged && (
          <Select value={scope} onValueChange={(v) => setScope(v as 'mine' | 'all')}>
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mine">
                <span className="flex items-center gap-2">My follow-ups</span>
              </SelectItem>
              <SelectItem value="all">
                <span className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" /> Everyone (admin)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
        <Select value={bucket} onValueChange={(v) => setBucket(v as FollowUpBucket)}>
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">All open</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="today">Due today</SelectItem>
            <SelectItem value="soon">Due soon</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="all">Everything</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading follow-ups…</p>
        ) : rows.length === 0 ? (
          <div className="space-y-2 p-10 text-center">
            <AlarmClockOff className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="font-medium">Nothing here</p>
            <p className="text-sm text-muted-foreground">
              Set a follow-up whenever you send an email, quotation, or speak to a customer.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Follow-up</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Responsible</th>
                  <th className="px-4 py-3 font-medium">Created by</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => {
                  const bk = followUpBucket(f);
                  const style = BUCKET_STYLES[bk];
                  return (
                    <tr key={f.id} className={`border-b last:border-0 hover:bg-muted/30 ${style.border}`}>
                      <td className="max-w-[320px] px-4 py-3">
                        <p className="font-medium">{f.title}</p>
                        {f.entity_label ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {ENTITY_TYPE_LABELS[f.entity_type]} · {f.entity_label}
                          </p>
                        ) : null}
                        {(f.watcher_names || []).length > 0 && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            👁 {f.watcher_names!.join(', ')}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 capitalize">
                          {typeIcon(f.follow_up_type)}
                          {FOLLOW_UP_TYPE_LABELS[f.follow_up_type]}
                        </span>
                        {f.follow_up_type === 'email' && f.email_status ? (
                          <Badge variant="outline" className="mt-1 text-[10px]">
                            {EMAIL_STATUS_LABELS[f.email_status]}
                          </Badge>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">{f.assigned_to_name || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{f.created_by_name || '—'}</td>
                      <td className="px-4 py-3">
                        <p>{formatUkDateTime(f.due_at)}</p>
                        {bk === 'overdue' && (f.overdue_days ?? 0) >= 0 ? (
                          <p className="text-xs font-semibold text-red-600">
                            {f.overdue_days === 0 ? 'Overdue today' : `${f.overdue_days} day${f.overdue_days === 1 ? '' : 's'} overdue`}
                            {f.escalation_level > 0 ? ' · escalated' : ''}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.badge}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {f.status === 'pending' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              disabled={completeMut.isPending || !canEdit(f)}
                              onClick={() => completeMut.mutate(f.id)}
                              title="Mark completed"
                            >
                              {completeMut.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={reopenMut.isPending || !canEdit(f)}
                              onClick={() => reopenMut.mutate(f.id)}
                              title="Reopen"
                            >
                              Reopen
                            </Button>
                          )}
                          {canEdit(f) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setEditing(f); setDialogOpen(true); }}
                              title="Edit / reassign / reschedule"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => setHistoryFor(f)} title="History">
                            <History className="h-4 w-4" />
                          </Button>
                          {canDelete(f) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                              onClick={() => {
                                if (confirm(`Delete follow-up "${f.title}"?`)) deleteMut.mutate(f.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <FollowUpDialog open={dialogOpen} onOpenChange={setDialogOpen} existing={editing} />

      {/* History dialog */}
      <Dialog open={!!historyFor} onOpenChange={(o) => !o && setHistoryFor(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>History — {historyFor?.title}</DialogTitle>
          </DialogHeader>
          {eventsLoading ? (
            <p className="text-sm text-muted-foreground">Loading history…</p>
          ) : (events || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          ) : (
            <ul className="space-y-3">
              {(events || []).map((e) => (
                <li key={e.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium capitalize">
                      {e.action.replace(/_/g, ' ')}
                      <span className="ml-1 font-normal text-muted-foreground">by {e.actor_name || 'System'}</span>
                    </p>
                    <p className="shrink-0 text-xs text-muted-foreground">{formatUkDateTime(e.created_at)}</p>
                  </div>
                  {e.detail ? <p className="mt-1 text-xs text-muted-foreground">{e.detail}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
