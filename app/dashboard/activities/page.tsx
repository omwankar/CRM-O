'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Phone, Mail, Users, StickyNote, Plus, Loader2, Activity } from 'lucide-react';
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
import { createActivity, getActivities } from '@/lib/api/activities';
import { EntityRecordPicker } from '@/components/tasks/EntityRecordPicker';
import {
  ACTIVITY_OUTCOME_LABELS,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPES_ORDER,
  CALL_OUTCOMES,
  type ActivityEntityType,
  type ActivityOutcome,
  type ActivityType,
} from '@/types/activities';
import type { TaskEntityType } from '@/types/tasks';
import { formatUkDateTime } from '@/lib/date';

const TYPE_ICON: Record<ActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: StickyNote,
};

const ENTITY_LABELS: Record<ActivityEntityType, string> = {
  lead: 'Lead',
  opportunity: 'Opportunity',
  enquiry: 'Enquiry',
  quotation: 'Quotation',
  buyer: 'Buyer',
  vendor: 'Vendor',
  contact: 'Contact',
  company: 'Company',
  job: 'Job',
  project: 'Project',
  partnership: 'Partner',
};

const ENTITY_HREF: Partial<Record<ActivityEntityType, (id: string) => string>> = {
  lead: () => '/dashboard/leads',
  opportunity: (id) => `/dashboard/opportunities/${id}`,
  enquiry: (id) => `/dashboard/enquiries/${id}`,
  quotation: (id) => `/dashboard/quotations/${id}`,
  buyer: (id) => `/dashboard/buyers/${id}`,
  vendor: (id) => `/dashboard/vendors/${id}`,
  contact: () => '/dashboard/contacts',
  company: (id) => `/dashboard/companies/${id}`,
  job: (id) => `/dashboard/jobs/${id}`,
  project: (id) => `/dashboard/projects/${id}`,
  partnership: (id) => `/dashboard/partnerships/${id}`,
};

export default function ActivitiesPage() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: 'call' as ActivityType,
    entity_type: 'lead' as ActivityEntityType,
    entity_id: '',
    entity_label: '',
    subject: '',
    notes: '',
    activity_date: new Date().toISOString().slice(0, 16),
    outcome: '' as '' | ActivityOutcome,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['activities', 'global', typeFilter],
    queryFn: () =>
      getActivities({
        type: typeFilter === 'all' ? undefined : typeFilter,
        limit: 100,
      }),
  });

  const createMut = useMutation({
    mutationFn: () =>
      createActivity({
        type: form.type,
        entity_type: form.entity_type,
        entity_id: form.entity_id,
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
        entity_type: 'lead',
        entity_id: '',
        entity_label: '',
        subject: '',
        notes: '',
        activity_date: new Date().toISOString().slice(0, 16),
        outcome: '',
      });
      qc.invalidateQueries({ queryKey: ['activities'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['opportunities'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
          <p className="mt-1 text-muted-foreground">
            Calls, emails, meetings, and notes across leads, deals, and accounts.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Log activity
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {ACTIVITY_TYPES_ORDER.map((t) => (
              <SelectItem key={t} value={t}>
                {ACTIVITY_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading activities…</p>
      ) : rows.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
          <Activity className="h-8 w-8 opacity-40" />
          <p>No activities yet. Log a call or note from here or any record timeline.</p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {rows.map((a) => {
            const Icon = TYPE_ICON[a.type] || StickyNote;
            const hrefFn = ENTITY_HREF[a.entity_type];
            const href = hrefFn ? hrefFn(a.entity_id) : null;
            return (
              <li key={a.id}>
                <Card className="flex gap-3 p-4">
                  <div className="mt-0.5 rounded-md border bg-muted/40 p-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{a.subject}</p>
                      <Badge variant="secondary" className="text-xs">
                        {ACTIVITY_TYPE_LABELS[a.type]}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {ENTITY_LABELS[a.entity_type] || a.entity_type}
                      </Badge>
                      {a.outcome ? (
                        <Badge variant="outline" className="text-xs">
                          {ACTIVITY_OUTCOME_LABELS[a.outcome] || a.outcome}
                        </Badge>
                      ) : null}
                    </div>
                    {a.notes ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.notes}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatUkDateTime(a.activity_date)}
                      {a.creator?.full_name ? ` · ${a.creator.full_name}` : ''}
                      {href ? (
                        <>
                          {' · '}
                          <Link href={href} className="text-blue-600 hover:underline">
                            Open record
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </div>
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
              <Label>Linked to</Label>
              <Select
                value={form.entity_type}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    entity_type: v as ActivityEntityType,
                    entity_id: '',
                    entity_label: '',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ENTITY_LABELS) as ActivityEntityType[])
                    .filter((t) => t !== 'quotation')
                    .map((t) => (
                      <SelectItem key={t} value={t}>
                        {ENTITY_LABELS[t]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <EntityRecordPicker
                entityType={form.entity_type as TaskEntityType}
                value={form.entity_id}
                label={form.entity_label}
                onChange={(id, label) => setForm((f) => ({ ...f, entity_id: id, entity_label: label }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Subject *</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
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
                    <SelectValue />
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
              disabled={!form.subject.trim() || !form.entity_id || createMut.isPending}
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
