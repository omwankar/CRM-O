'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createEnquiry, type EnquiryInput } from '@/lib/api/enquiries';
import { getBuyers } from '@/lib/api/buyers';
import { ENQUIRY_CURRENCIES, ENQUIRY_STAGE_LABELS, ENQUIRY_STAGES_ORDER } from '@/types/enquiries';

export default function NewEnquiryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetOpportunityId = searchParams.get('opportunity_id');
  const presetBuyerId = searchParams.get('buyer_id');

  const [form, setForm] = useState<EnquiryInput>({
    title: '',
    requirement: '',
    standalone_project_name: '',
    prospect_name: '',
    client_email: '',
    client_budget: null,
    client_currency: 'INR',
    deadline: '',
    priority: 'medium',
    stage: 'new_enquiry',
    notes: '',
    buyer_id: presetBuyerId,
    opportunity_id: presetOpportunityId,
  });

  useEffect(() => {
    if (presetBuyerId) setForm((f) => ({ ...f, buyer_id: presetBuyerId }));
    if (presetOpportunityId) setForm((f) => ({ ...f, opportunity_id: presetOpportunityId }));
  }, [presetBuyerId, presetOpportunityId]);

  const { data: buyersData } = useQuery({
    queryKey: ['buyers-enquiry-form'],
    queryFn: () => getBuyers({ limit: 200 }),
  });

  const saveMut = useMutation({
    mutationFn: () =>
      createEnquiry({
        ...form,
        title: form.title?.trim() || null,
        standalone_project_name: form.standalone_project_name?.trim() || null,
        prospect_name: form.prospect_name?.trim() || null,
        client_email: form.client_email?.trim() || null,
        notes: form.notes?.trim() || null,
        deadline: form.deadline || null,
        buyer_id: form.buyer_id || null,
        opportunity_id: form.opportunity_id || null,
        client_budget:
          form.client_budget === null || form.client_budget === undefined || Number.isNaN(Number(form.client_budget))
            ? null
            : Number(form.client_budget),
      }),
    onSuccess: (enquiry) => {
      toast.success(`Enquiry ${enquiry.enquiry_number} created`);
      router.push(`/dashboard/enquiries/${enquiry.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/enquiries">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New enquiry</h1>
          <p className="text-sm text-muted-foreground">
            Record the customer request before you start pricing.
          </p>
        </div>
      </div>

      <Card className="p-6 space-y-5">
        {form.opportunity_id ? (
          <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            Linked to opportunity — pricing work will stay under that deal.
          </p>
        ) : null}

        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={form.title || ''}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Short title for this request"
          />
        </div>

        <div className="space-y-2">
          <Label>Requirement *</Label>
          <Textarea
            rows={5}
            value={form.requirement}
            onChange={(e) => setForm((f) => ({ ...f, requirement: e.target.value }))}
            placeholder="Describe what the customer needs (min 10 characters)"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Buyer (optional)</Label>
            <Select
              value={form.buyer_id || 'none'}
              onValueChange={(v) => setForm((f) => ({ ...f, buyer_id: v === 'none' ? null : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select buyer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No buyer yet (prospect)</SelectItem>
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
              placeholder="If not yet a buyer"
              disabled={Boolean(form.buyer_id)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
              onChange={(e) => setForm((f) => ({ ...f, standalone_project_name: e.target.value }))}
              placeholder="Standalone project or customer label"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
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
          <div className="space-y-2">
            <Label>Deadline</Label>
            <Input
              type="date"
              value={form.deadline || ''}
              onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="space-y-2">
            <Label>Stage</Label>
            <Select
              value={form.stage || 'new_enquiry'}
              onValueChange={(v) => setForm((f) => ({ ...f, stage: v as EnquiryInput['stage'] }))}
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
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            rows={3}
            value={form.notes || ''}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/enquiries">Cancel</Link>
          </Button>
          <Button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || (form.requirement || '').trim().length < 10}
          >
            {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create enquiry
          </Button>
        </div>
      </Card>
    </div>
  );
}
