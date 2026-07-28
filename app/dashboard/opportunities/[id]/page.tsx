'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Pencil, Save, Package } from 'lucide-react';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getOpportunity, updateOpportunity } from '@/lib/api/opportunities';
import { getJobs } from '@/lib/api/jobs';
import { ActivityTimeline } from '@/components/activities/ActivityTimeline';
import { EntityTaskList } from '@/components/tasks/EntityTaskList';
import { CanWrite } from '@/components/auth/Can';
import {
  OPPORTUNITY_STAGE_BADGE,
  OPPORTUNITY_STAGE_LABELS,
  OPPORTUNITY_STAGES_ORDER,
  type OpportunityInput,
  type OpportunityStage,
} from '@/types/opportunities';
import { formatUkDate } from '@/lib/date';

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<OpportunityInput> | null>(null);
  const [createJobOpen, setCreateJobOpen] = useState(false);

  const { data: opp, isLoading } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => getOpportunity(id!),
    enabled: !!id,
  });

  const { data: linkedJobs } = useQuery({
    queryKey: ['jobs', 'by-opportunity', id],
    queryFn: () => getJobs({ opportunity_id: id!, limit: 20 }),
    enabled: !!id && opp?.stage === 'closed_won',
  });

  const startEdit = () => {
    if (!opp) return;
    setForm({
      title: opp.title,
      stage: opp.stage,
      value: opp.value,
      currency: opp.currency || 'INR',
      expected_close_date: opp.expected_close_date ? String(opp.expected_close_date).slice(0, 10) : '',
      notes: opp.notes,
    });
    setEditing(true);
  };

  const saveMut = useMutation({
    mutationFn: () =>
      updateOpportunity(id!, {
        ...form,
        expected_close_date: form?.expected_close_date || null,
        notes: form?.notes?.trim() || null,
        value:
          form?.value === null || form?.value === undefined || Number.isNaN(Number(form.value))
            ? null
            : Number(form.value),
      }),
    onSuccess: () => {
      const becameWon = form?.stage === 'closed_won' && opp?.stage !== 'closed_won';
      toast.success('Opportunity updated');
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['opportunity', id] });
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      if (becameWon) setCreateJobOpen(true);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !opp) {
    return <p className="p-6 text-sm text-muted-foreground">Loading opportunity…</p>;
  }

  const jobsForOpp = linkedJobs?.jobs || [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/opportunities">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{opp.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Buyer:{' '}
              {opp.buyer?.id ? (
                <Link href={`/dashboard/buyers/${opp.buyer.id}`} className="text-blue-600 hover:underline">
                  {opp.buyer.buyer_name}
                </Link>
              ) : (
                '—'
              )}
            </p>
            <Badge variant="outline" className={`mt-2 ${OPPORTUNITY_STAGE_BADGE[opp.stage]}`}>
              {OPPORTUNITY_STAGE_LABELS[opp.stage]}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <Button variant="outline" onClick={startEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </>
          )}
          {opp.stage === 'closed_won' && (
            <CanWrite>
              <Button variant="secondary" asChild>
                <Link href={`/dashboard/jobs/new?opportunity_id=${opp.id}`}>
                  <Package className="w-4 h-4 mr-2" />
                  Create Job
                </Link>
              </Button>
            </CanWrite>
          )}
          <Button asChild>
            <Link href={`/dashboard/enquiries/new?opportunity_id=${opp.id}&buyer_id=${opp.buyer_id}`}>
              New enquiry
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 space-y-3 lg:col-span-2">
          <h2 className="font-semibold">Deal details</h2>
          {editing && form ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.title || ''}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Stage</Label>
                  <Select
                    value={form.stage || 'lead'}
                    onValueChange={(v) => setForm((f) => ({ ...f, stage: v as OpportunityStage }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPPORTUNITY_STAGES_ORDER.map((s) => (
                        <SelectItem key={s} value={s}>
                          {OPPORTUNITY_STAGE_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expected close</Label>
                  <Input
                    type="date"
                    value={form.expected_close_date || ''}
                    onChange={(e) => setForm((f) => ({ ...f, expected_close_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    type="number"
                    value={form.value ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        value: e.target.value === '' ? null : Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input
                    value={form.currency || 'INR'}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  rows={4}
                  value={form.notes || ''}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
          ) : (
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Value</dt>
                <dd className="tabular-nums">
                  {opp.value != null ? `${opp.currency || ''} ${Number(opp.value).toLocaleString()}` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Expected close</dt>
                <dd>
                  {opp.expected_close_date
                    ? formatUkDate(opp.expected_close_date)
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Owner</dt>
                <dd>{opp.owner?.full_name || '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Notes</dt>
                <dd className="whitespace-pre-wrap">{opp.notes || '—'}</dd>
              </div>
            </dl>
          )}
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Chain</h2>
          <p className="text-xs text-muted-foreground">
            Lead → Opportunity → Enquiry → Quotation → Invoice → Job
          </p>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Enquiries</p>
            {(opp.enquiries || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">None yet</p>
            ) : (
              <ul className="space-y-1">
                {opp.enquiries!.map((e) => (
                  <li key={e.id}>
                    <Link href={`/dashboard/enquiries/${e.id}`} className="text-sm text-blue-600 hover:underline font-mono">
                      {e.enquiry_number}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Quotations</p>
            {(opp.quotations || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">None yet</p>
            ) : (
              <ul className="space-y-1">
                {opp.quotations!.map((q) => (
                  <li key={q.id}>
                    <Link href={`/dashboard/quotations/${q.id}`} className="text-sm text-blue-600 hover:underline font-mono">
                      {q.quotation_number}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {opp.stage === 'closed_won' && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Jobs</p>
              {jobsForOpp.length === 0 ? (
                <p className="text-sm text-muted-foreground">None yet</p>
              ) : (
                <ul className="space-y-1">
                  {jobsForOpp.map((j) => (
                    <li key={j.id}>
                      <Link
                        href={`/dashboard/jobs/${j.id}`}
                        className="text-sm text-blue-600 hover:underline font-mono"
                      >
                        {j.job_number}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <ActivityTimeline entityType="opportunity" entityId={opp.id} />
      </Card>

      <Card className="p-5">
        <EntityTaskList entityType="opportunity" entityId={opp.id} />
      </Card>

      <Dialog open={createJobOpen} onOpenChange={setCreateJobOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Job from this Opportunity?</DialogTitle>
            <DialogDescription>
              This deal is Closed Won. Create a shipment job now, or skip if it will ship later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCreateJobOpen(false)}>
              Not now
            </Button>
            <Button
              onClick={() => {
                setCreateJobOpen(false);
                router.push(`/dashboard/jobs/new?opportunity_id=${opp.id}`);
              }}
            >
              Create Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
