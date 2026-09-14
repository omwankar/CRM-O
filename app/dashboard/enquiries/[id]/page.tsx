'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlarmClockCheck,
  ArrowLeft,
  ArrowRightCircle,
  Loader2,
  Mail,
  Pencil,
  Save,
} from 'lucide-react';
import { FollowUpDialog } from '@/components/followups/FollowUpDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

/** Split a structured requirement text into summary, label/value pairs and bullet lines. */
function parseRequirement(requirement: string) {
  const pairs: Array<{ label: string; value: string }> = [];
  const bullets: string[] = [];
  const freeText: string[] = [];
  let summary = '';

  for (const rawLine of String(requirement || '').split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^[•·]/.test(line)) {
      bullets.push(line.replace(/^[•·]\s*/, ''));
      continue;
    }
    const m = line.match(/^([A-Za-z][A-Za-z /()'&-]{1,32}?):\s+(.+)$/);
    if (m) {
      pairs.push({ label: m[1], value: m[2] });
      continue;
    }
    if (!summary) summary = line;
    else freeText.push(line);
  }
  return { summary, pairs, bullets, freeText };
}

/** Pull "Received through: X" / "Sender phone: X" and the original message out of notes. */
function parseNotes(notes: string | null) {
  const text = String(notes || '');
  const receivedVia = text.match(/^Received through:\s*(.+)$/m)?.[1]?.trim() || '';
  const senderPhone = text.match(/^Sender phone:\s*(.+)$/m)?.[1]?.trim() || '';
  const idx = text.indexOf('--- Original message ---');
  const original = idx >= 0 ? text.slice(idx + '--- Original message ---'.length).trim() : '';
  const plain = idx >= 0
    ? text.slice(0, idx).replace(/^Received through:.*$/m, '').replace(/^Sender phone:.*$/m, '').trim()
    : text.replace(/^Received through:.*$/m, '').replace(/^Sender phone:.*$/m, '').trim();
  return { receivedVia, senderPhone, original, plain };
}

function FieldBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/30 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium">{value}</p>
    </div>
  );
}

export default function EnquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<EnquiryInput> | null>(null);
  const [followUpOpen, setFollowUpOpen] = useState(false);

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

  const parsedReq = useMemo(() => parseRequirement(enquiry?.requirement || ''), [enquiry?.requirement]);
  const parsedNotes = useMemo(() => parseNotes(enquiry?.notes || null), [enquiry?.notes]);

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
  const quotationCount = (enquiry.quotations || []).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
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
              {parsedNotes.receivedVia ? (
                <Badge variant="outline" className="border-teal-300 bg-teal-50 text-teal-700">
                  <Mail className="mr-1 h-3 w-3" />
                  {parsedNotes.receivedVia}
                </Badge>
              ) : null}
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
          <Button
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-50"
            onClick={() => setFollowUpOpen(true)}
          >
            <AlarmClockCheck className="w-4 h-4 mr-2" />
            Set follow-up
          </Button>
          <Button onClick={() => convertMut.mutate()} disabled={convertMut.isPending}>
            {convertMut.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ArrowRightCircle className="w-4 h-4 mr-2" />
            )}
            {quotationCount > 0 ? 'Create another quotation' : 'Create Quotation'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="message">Original message</TabsTrigger>
          <TabsTrigger value="quotations">Quotations ({quotationCount})</TabsTrigger>
          <TabsTrigger value="activity">Activity &amp; tasks</TabsTrigger>
        </TabsList>

        {/* ---------------- Overview ---------------- */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {editing && form ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="p-5 space-y-4 lg:col-span-2">
                <h2 className="font-semibold">Requirement</h2>
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
                    rows={8}
                    value={form.requirement || ''}
                    onChange={(e) => setForm((f) => ({ ...f, requirement: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    rows={4}
                    value={form.notes || ''}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </Card>

              <Card className="p-5 space-y-3">
                <h2 className="font-semibold">Details</h2>
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
              </Card>
            </div>
          ) : (
            <>
              {parsedReq.summary ? (
                <p className="rounded-lg border border-violet-100 bg-violet-50/60 px-4 py-2.5 text-sm font-semibold text-violet-800">
                  {parsedReq.summary}
                </p>
              ) : null}

              <Card className="p-5">
                <h2 className="mb-3 font-semibold">Shipment details</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {parsedReq.pairs.map((p) => (
                    <FieldBox key={p.label + p.value} label={p.label} value={p.value} />
                  ))}
                  {parsedReq.pairs.length === 0 ? (
                    <p className="col-span-full whitespace-pre-wrap text-sm leading-relaxed">
                      {enquiry.requirement}
                    </p>
                  ) : null}
                </div>
                {parsedReq.bullets.length > 0 && (
                  <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/30 px-3 py-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Cargo detail
                    </p>
                    <ul className="mt-1 space-y-0.5 text-sm">
                      {parsedReq.bullets.map((b) => (
                        <li key={b}>• {b}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {parsedReq.freeText.length > 0 && (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                    {parsedReq.freeText.join('\n')}
                  </p>
                )}
              </Card>

              <Card className="p-5">
                <h2 className="mb-3 font-semibold">Customer &amp; commercial</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <FieldBox
                    label="Customer"
                    value={
                      enquiry.buyer?.buyer_name ||
                      enquiry.prospect_name ||
                      enquiry.standalone_project_name ||
                      '—'
                    }
                  />
                  <FieldBox label="Email" value={enquiry.client_email || '—'} />
                  {parsedNotes.senderPhone ? (
                    <FieldBox label="Phone" value={parsedNotes.senderPhone} />
                  ) : null}
                  {parsedNotes.receivedVia ? (
                    <FieldBox label="Received via" value={parsedNotes.receivedVia} />
                  ) : null}
                  <FieldBox label="Owner" value={enquiry.owner?.full_name || '—'} />
                  <FieldBox
                    label="Budget / target"
                    value={
                      enquiry.client_budget != null
                        ? `${enquiry.client_currency || ''} ${Number(enquiry.client_budget).toLocaleString()}`
                        : '—'
                    }
                  />
                  <FieldBox
                    label="Deadline / ready date"
                    value={enquiry.deadline ? formatUkDate(enquiry.deadline) : '—'}
                  />
                  <FieldBox label="Created" value={formatUkDateTime(enquiry.created_at)} />
                  <FieldBox label="Last updated" value={formatUkDateTime(enquiry.updated_at)} />
                  {enquiry.outcome ? <FieldBox label="Outcome" value={enquiry.outcome} /> : null}
                </div>
                {parsedNotes.plain ? (
                  <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Notes
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{parsedNotes.plain}</p>
                  </div>
                ) : null}
              </Card>
            </>
          )}
        </TabsContent>

        {/* ---------------- Original message ---------------- */}
        <TabsContent value="message" className="mt-4">
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Original message</h2>
            {parsedNotes.original ? (
              <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-lg border border-blue-100 bg-blue-50/30 p-4 font-mono text-xs leading-relaxed">
                {parsedNotes.original}
              </pre>
            ) : enquiry.notes ? (
              <p className="whitespace-pre-wrap text-sm">{enquiry.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No original message stored. Enquiries created through the Inquiry Inbox keep the
                pasted email or WhatsApp text here.
              </p>
            )}
          </Card>
        </TabsContent>

        {/* ---------------- Quotations ---------------- */}
        <TabsContent value="quotations" className="mt-4">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Linked quotations</h2>
              <p className="text-xs text-muted-foreground">
                One enquiry can have multiple quotations (e.g. revised scope).
              </p>
            </div>
            {quotationCount === 0 ? (
              <p className="text-sm text-muted-foreground">
                No quotations yet. Use <strong>Create Quotation</strong> when you are ready to price.
              </p>
            ) : (
              <ul className="divide-y">
                {enquiry.quotations!.map((q) => (
                  <li key={q.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <Link
                        href={`/dashboard/quotations/${q.id}`}
                        className="font-mono text-sm text-blue-600 hover:underline"
                      >
                        {q.quotation_number}
                      </Link>
                      <p className="text-xs capitalize text-muted-foreground">
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
        </TabsContent>

        {/* ---------------- Activity & tasks ---------------- */}
        <TabsContent value="activity" className="mt-4 space-y-4">
          <Card className="p-5">
            <ActivityTimeline entityType="enquiry" entityId={enquiry.id} />
          </Card>
          <Card className="p-5">
            <EntityTaskList entityType="enquiry" entityId={enquiry.id} />
          </Card>
        </TabsContent>
      </Tabs>

      <FollowUpDialog
        open={followUpOpen}
        onOpenChange={setFollowUpOpen}
        preset={{
          entity_type: 'enquiry',
          entity_id: enquiry.id,
          entity_label: `${enquiry.enquiry_number}${enquiry.title ? ` — ${enquiry.title}` : ''}`,
          title: `Follow up: ${enquiry.title || enquiry.enquiry_number}`,
          follow_up_type: 'email',
        }}
      />
    </div>
  );
}
