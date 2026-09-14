'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createFollowUp, updateFollowUp } from '@/lib/api/followups';
import { getUsers } from '@/lib/api/users';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  EMAIL_STATUS_LABELS,
  ENTITY_TYPE_LABELS,
  FOLLOW_UP_TYPE_LABELS,
  type FollowUp,
  type FollowUpEmailStatus,
  type FollowUpEntityType,
  type FollowUpType,
} from '@/types/followups';

interface UserRow {
  id: string;
  full_name?: string;
  email?: string;
}

export interface FollowUpPreset {
  entity_type?: FollowUpEntityType;
  entity_id?: string | null;
  entity_label?: string | null;
  title?: string;
  follow_up_type?: FollowUpType;
}

/** Create or edit a follow-up. Pass `existing` to edit, `preset` to prefill from a CRM record. */
export function FollowUpDialog({
  open,
  onOpenChange,
  existing,
  preset,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: FollowUp | null;
  preset?: FollowUpPreset;
  onSaved?: () => void;
}) {
  const qc = useQueryClient();
  const { user } = useCurrentUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [entityType, setEntityType] = useState<FollowUpEntityType>('other');
  const [entityLabel, setEntityLabel] = useState('');
  const [followUpType, setFollowUpType] = useState<FollowUpType>('other');
  const [emailStatus, setEmailStatus] = useState<FollowUpEmailStatus | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('10:00');
  const [assignedTo, setAssignedTo] = useState('');
  const [watchers, setWatchers] = useState<string[]>([]);

  const { data: usersData } = useQuery({
    queryKey: ['users-followup-dialog'],
    queryFn: () => getUsers({ limit: 200 }) as Promise<{ data: UserRow[] }>,
    enabled: open,
  });
  const users = usersData?.data || [];

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description || '');
      setEntityType(existing.entity_type);
      setEntityLabel(existing.entity_label || '');
      setFollowUpType(existing.follow_up_type);
      setEmailStatus(existing.email_status || '');
      const d = new Date(existing.due_at);
      setDueDate(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      );
      setDueTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
      setAssignedTo(existing.assigned_to || '');
      setWatchers(existing.watchers || []);
    } else {
      setTitle(preset?.title || '');
      setDescription('');
      setEntityType(preset?.entity_type || 'other');
      setEntityLabel(preset?.entity_label || '');
      setFollowUpType(preset?.follow_up_type || 'other');
      setEmailStatus('');
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      setDueDate(
        `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`,
      );
      setDueTime('10:00');
      setAssignedTo(user?.id || '');
      setWatchers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existing?.id]);

  const saveMut = useMutation({
    mutationFn: () => {
      const dueAt = new Date(`${dueDate}T${dueTime || '10:00'}:00`).toISOString();
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        entity_type: entityType,
        entity_id: preset?.entity_id || existing?.entity_id || null,
        entity_label: entityLabel.trim() || null,
        follow_up_type: followUpType,
        email_status: followUpType === 'email' ? emailStatus || 'follow_up_pending' : null,
        due_at: dueAt,
        assigned_to: assignedTo || null,
        watchers,
      };
      return existing ? updateFollowUp(existing.id, payload) : createFollowUp(payload);
    },
    onSuccess: () => {
      toast.success(existing ? 'Follow-up updated' : 'Follow-up created');
      qc.invalidateQueries({ queryKey: ['followups'] });
      qc.invalidateQueries({ queryKey: ['followup-summary'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onOpenChange(false);
      onSaved?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleWatcher = (id: string) => {
    setWatchers((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit follow-up' : 'Set a follow-up'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>What needs to be followed up? *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chase Aqaba quotation reply from Nuba Logistics"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Follow-up type</Label>
              <Select value={followUpType} onValueChange={(v) => setFollowUpType(v as FollowUpType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FOLLOW_UP_TYPE_LABELS) as FollowUpType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {FOLLOW_UP_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Related to</Label>
              <Select value={entityType} onValueChange={(v) => setEntityType(v as FollowUpEntityType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ENTITY_TYPE_LABELS) as FollowUpEntityType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {ENTITY_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {followUpType === 'email' && (
            <div className="space-y-1.5">
              <Label>Email status</Label>
              <Select
                value={emailStatus || 'follow_up_pending'}
                onValueChange={(v) => setEmailStatus(v as FollowUpEmailStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(EMAIL_STATUS_LABELS) as FollowUpEmailStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {EMAIL_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Sending an email does not complete the follow-up — mark it completed only when the
                loop is truly closed.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Reference (customer / record)</Label>
            <Input
              value={entityLabel}
              onChange={(e) => setEntityLabel(e.target.value)}
              placeholder="e.g. ENQ-2026-014 — UK to Aqaba, or customer name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Next follow-up date *</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Responsible person</Label>
            <Select value={assignedTo || 'me'} onValueChange={(v) => setAssignedTo(v === 'me' ? user?.id || '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Assign to…" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.full_name || u.email}
                    {u.id === user?.id ? ' (me)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Watchers / collaborators (notified on changes)</Label>
            <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-border p-2">
              {users
                .filter((u) => u.id !== (assignedTo || user?.id))
                .map((u) => (
                  <label key={u.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted">
                    <Checkbox checked={watchers.includes(u.id)} onCheckedChange={() => toggleWatcher(u.id)} />
                    {u.full_name || u.email}
                  </label>
                ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Context for whoever picks this up"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending || title.trim().length < 3 || !dueDate}
            >
              {saveMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {existing ? 'Save changes' : 'Create follow-up'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
