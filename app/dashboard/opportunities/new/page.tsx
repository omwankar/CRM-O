'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { createOpportunity, type OpportunityInput } from '@/lib/api/opportunities';
import { getBuyers } from '@/lib/api/buyers';
import {
  OPPORTUNITY_STAGE_LABELS,
  OPPORTUNITY_STAGES_ORDER,
  type OpportunityStage,
} from '@/types/opportunities';

function NewOpportunityPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetBuyerId = searchParams.get('buyer_id') || '';

  const [form, setForm] = useState<OpportunityInput>({
    buyer_id: presetBuyerId,
    title: '',
    stage: 'lead',
    value: null,
    currency: 'INR',
    expected_close_date: '',
    notes: '',
  });

  useEffect(() => {
    if (presetBuyerId) setForm((f) => ({ ...f, buyer_id: presetBuyerId }));
  }, [presetBuyerId]);

  const { data: buyersData } = useQuery({
    queryKey: ['buyers-opp-form'],
    queryFn: () => getBuyers({ limit: 200 }),
  });

  const saveMut = useMutation({
    mutationFn: () =>
      createOpportunity({
        ...form,
        expected_close_date: form.expected_close_date || null,
        notes: form.notes?.trim() || null,
        value:
          form.value === null || form.value === undefined || Number.isNaN(Number(form.value))
            ? null
            : Number(form.value),
      }),
    onSuccess: (opp) => {
      toast.success('Opportunity created');
      router.push(`/dashboard/opportunities/${opp.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/opportunities">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New opportunity</h1>
          <p className="text-sm text-muted-foreground">
            Open a deal against an existing buyer (repeat customers supported).
          </p>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label>Buyer *</Label>
          <Select
            value={form.buyer_id || undefined}
            onValueChange={(v) => setForm((f) => ({ ...f, buyer_id: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select buyer" />
            </SelectTrigger>
            <SelectContent>
              {(buyersData?.data || []).map((b: { id: string; buyer_name: string }) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.buyer_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Title *</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Riyadh–Jeddah lane Q3"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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

        <div className="grid gap-4 sm:grid-cols-2">
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
            rows={3}
            value={form.notes || ''}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/opportunities">Cancel</Link>
          </Button>
          <Button
            onClick={() => saveMut.mutate()}
            disabled={!form.buyer_id || !form.title.trim() || saveMut.isPending}
          >
            {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function NewOpportunityPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <NewOpportunityPageInner />
    </Suspense>
  );
}
