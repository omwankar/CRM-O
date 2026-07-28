'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRightCircle,
  Loader2,
  Pencil,
  Save,
} from 'lucide-react';
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
  convertEnquiryToQuotation,
  getEnquiry,
  updateEnquiry,
} from '@/lib/api/enquiries';
import { getBuyers } from '@/lib/api/buyers';
import {
  ENQUIRY_CURRENCIES,
  ENQUIRY_STAGE_BADGE_CLASSES,
  ENQUIRY_STAGE_LABELS,
  ENQUIRY_STAGES_ORDER,
  type EnquiryInput,
  type EnquiryStage,
} from '@/types/enquiries';
import { ActivityTimeline } from '@/components/activities/ActivityTimeline';
import { EntityTaskList } from '@/components/tasks/EntityTaskList';
import { formatUkDate, formatUkDateTime } from '@/lib/date';

export default function EnquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<EnquiryInput> | null>(null);

  const { data: enquiry, isLoading } = useQuery({
    queryKey: ['enquiry', id],
    queryFn: () => getEnquiry(id!),
    enabled: !!id,
  });

  const { data: buyersData } = useQuery({
    queryKey: ['buyers-enquiry-detail'],
    queryFn: () => getBuyers({ limit: 200 }),
    enabled: editing,
  });

  const startEdit = () => {
    if (!enquiry) return;
    setForm({
      title: enquiry.title,
      requirement: enquiry.requirement,
      standalone_project_name: enquiry.standalone_project_name,
      prospect_name: enquiry.prospect_name,
      client_email: enquiry.client_email,
      client_budget: enquiry.client_budget,
      client_currency: enquiry.client_currency || 'INR',
      deadline: enquiry.deadline ? String(enquiry.deadline).slice(0, 10) : '',
      priority: enquiry.priority,
      stage: enquiry.stage,
      notes: enquiry.notes,
      buyer_id: enquiry.buyer_id,
      outcome: enquiry.outcome,
    });
    setEditing(true);
  };

  const saveMut = useMutation({
    mutationFn: () => updateEnquiry(id!, {
      ...form,
      title: form?.title?.trim() || null,
      standalone_project_name: form?.standalone_project_name?.trim() || null,
      prospect_name: form?.prospect_name?.trim() || null,
      client_email: form?.client_email?.trim() || null,
      notes: form?.notes?.trim() || null,
      deadline: form?.deadline || null,
      buyer_id: form?.buyer_id || null,
      client_budget:
        form?.client_budget === null || form?.client_budget === undefined || Number.isNaN(Number(form.client_budget))
          ? null
          : Number(form.client_budget),
    }),
    onSuccess: () => {
      toast.success('Enquiry updated');
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['enquiry', id] });
      qc.invalidateQueries({ queryKey: ['enquiries'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const convertMut = useMutation({
    mutationFn: () => convertEnquiryToQuotation(id!),
    onSuccess: (result) => {
      toast.success(`Quotation ${result.quotation.quotation_number} created`);
      if (result.credit_warning?.message) {
        toast.warning(result.credit_warning.message, { duration: 8000 });
      }
      qc.invalidateQueries({ queryKey: ['enquiry', id] });
      router.push(`/dashboard/quotations/${result.quotation.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !enquiry) {
    return <p className="p-6 text-sm text-muted-foreground">Loading enquiry…</p>;
  }

  const stage = enquiry.stage as EnquiryStage;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/enquiries">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <p className="font-mono text-sm text-muted-foreground">{enquiry.enquiry_number}</p>
            <h1 className="text-2xl font-bold">
              {enquiry.title || enquiry.requirement.slice(0, 80)}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline" className={ENQUIRY_STAGE_BADGE_CLASSES[stage]}>
                {ENQUIRY_STAGE_LABELS[stage]}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {enquiry.priority}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
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
          <Button onClick={() => convertMut.mutate()} disabled={convertMut.isPending}>
            {convertMut.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ArrowRightCircle className="w-4 h-4 mr-2" />
            )}
            {(enquiry.quotations || []).length > 0 ? 'Create another quotation' : 'Create Quotation'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 space-y-4 lg:col-span-2">
          <h2 className="font-semibold">Requirement</h2>
          {editing && form ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.title || ''}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Requirement</Label>
                <Textarea
                  rows={6}
                  value={form.requirement || ''}
                  onChange={(e) => setForm((f) => ({ ...f, requirement: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  rows={3}
                  value={form.notes || ''}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{enquiry.requirement}</p>
              {enquiry.notes ? (
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground mb-1">Notes</p>
                  <p className="whitespace-pre-wrap text-sm">{enquiry.notes}</p>
                </div>
              ) : null}
            </>
          )}
        </Card>

        <Card className="p-5 space-y-4">
          <h2 className="font-semibold">Details</h2>
          {editing && form ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select
                  value={form.stage || 'new_enquiry'}
                  onValueChange={(v) => setForm((f) => ({ ...f, stage: v as EnquiryStage }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENQUIRY_STAGES_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ENQUIRY_STAGE_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Buyer</Label>
                <Select
                  value={form.buyer_id || 'none'}
                  onValueChange={(v) => setForm((f) => ({ ...f, buyer_id: v === 'none' ? null : v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Prospect / none</SelectItem>
                    {(buyersData?.data || []).map((b: { id: string; buyer_name: string }) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.buyer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prospect name</Label>
                <Input
                  value={form.prospect_name || ''}
                  onChange={(e) => setForm((f) => ({ ...f, prospect_name: e.target.value }))}
                  disabled={Boolean(form.buyer_id)}
                />
              </div>
              <div className="space-y-2">
                <Label>Client email</Label>
                <Input
                  type="email"
                  value={form.client_email || ''}
                  onChange={(e) => setForm((f) => ({ ...f, client_email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Project / customer name</Label>
                <Input
                  value={form.standalone_project_name || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, standalone_project_name: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Budget</Label>
                  <Input
                    type="number"
                    value={form.client_budget ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        client_budget: e.target.value === '' ? null : Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={form.client_currency || 'INR'}
                    onValueChange={(v) => setForm((f) => ({ ...f, client_currency: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENQUIRY_CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={form.deadline || ''}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority || 'medium'}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, priority: v as 'low' | 'medium' | 'high' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Customer</dt>
                <dd>
                  {enquiry.buyer?.buyer_name || enquiry.prospect_name || enquiry.standalone_project_name || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd>{enquiry.client_email || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Owner</dt>
                <dd>{enquiry.owner?.full_name || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Budget</dt>
                <dd>
                  {enquiry.client_budget != null
                    ? `${enquiry.client_currency || ''} ${Number(enquiry.client_budget).toLocaleString()}`
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Deadline</dt>
                <dd>{enquiry.deadline ? formatUkDate(enquiry.deadline) : '—'}</dd>
              </div>
              {enquiry.outcome ? (
                <div>
                  <dt className="text-xs text-muted-foreground">Outcome</dt>
                  <dd>{enquiry.outcome}</dd>
                </div>
              ) : null}
            </dl>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Linked quotations</h2>
          <p className="text-xs text-muted-foreground">
            One enquiry can have multiple quotations (e.g. revised scope).
          </p>
        </div>
        {(enquiry.quotations || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No quotations yet. Use <strong>Create Quotation</strong> when you are ready to price.
          </p>
        ) : (
          <ul className="divide-y">
            {enquiry.quotations!.map((q) => (
              <li key={q.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <Link
                    href={`/dashboard/quotations/${q.id}`}
                    className="font-mono text-sm text-blue-600 hover:underline"
                  >
                    {q.quotation_number}
                  </Link>
                  <p className="text-xs text-muted-foreground capitalize">
                    {q.status.replace(/_/g, ' ')}
                    {q.quote_sent_at ? ` · sent ${formatUkDateTime(q.quote_sent_at)}` : ''}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/quotations/${q.id}`}>Open</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <ActivityTimeline entityType="enquiry" entityId={enquiry.id} />
      </Card>

      <Card className="p-5">
        <EntityTaskList entityType="enquiry" entityId={enquiry.id} />
      </Card>
    </div>
  );
}
