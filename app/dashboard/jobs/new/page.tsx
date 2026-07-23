'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
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
import { createJob } from '@/lib/api/jobs';
import { getOpportunity, getOpportunities } from '@/lib/api/opportunities';
import { getUsers } from '@/lib/api/users';
import { getVendors } from '@/lib/api/vendors';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { JOB_MODE_LABELS, type JobModeType } from '@/types/jobs';

export default function NewJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const opportunityIdParam = searchParams.get('opportunity_id') || '';
  const { user } = useCurrentUser();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    opportunity_id: opportunityIdParam,
    origin: '',
    destination: '',
    cargo_description: '',
    weight_kg: '',
    volume_cbm: '',
    container_type: '',
    mode_type: '' as '' | JobModeType,
    supervisor_id: '',
    assigned_person_id: '',
    notes: '',
    vendor_ids: [] as string[],
  });

  const { data: opportunity } = useQuery({
    queryKey: ['opportunity', form.opportunity_id],
    queryFn: () => getOpportunity(form.opportunity_id),
    enabled: !!form.opportunity_id,
  });

  const { data: wonOpps } = useQuery({
    queryKey: ['opportunities', 'closed_won'],
    queryFn: () => getOpportunities({ stage: 'closed_won', limit: 100 }),
  });

  const { data: usersRes } = useQuery({
    queryKey: ['users', 'job-form'],
    queryFn: () => getUsers({ limit: 200 }),
  });

  const { data: vendorsRes } = useQuery({
    queryKey: ['vendors', 'job-form'],
    queryFn: () => getVendors({ limit: 100 }),
  });

  const users = usersRes?.data || [];
  const vendors = useMemo(() => {
    if (!vendorsRes) return [];
    if (Array.isArray(vendorsRes)) return vendorsRes;
    return (vendorsRes as any).vendors || (vendorsRes as any).data || [];
  }, [vendorsRes]);

  const oppOptions = useMemo(() => {
    return wonOpps?.data || [];
  }, [wonOpps]);

  useEffect(() => {
    if (opportunity && !form.title) {
      setForm((f) => ({
        ...f,
        title: opportunity.title,
        opportunity_id: opportunity.id,
      }));
    }
  }, [opportunity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('You must be signed in');
      return;
    }
    if (!form.opportunity_id) {
      toast.error('Select a won opportunity');
      return;
    }
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      const job = await createJob({
        title: form.title.trim(),
        opportunity_id: form.opportunity_id,
        buyer_id: opportunity?.buyer_id || null,
        quotation_id: opportunity?.quotations?.[0]?.id || null,
        origin: form.origin.trim() || null,
        destination: form.destination.trim() || null,
        cargo_description: form.cargo_description.trim() || null,
        weight_kg: form.weight_kg === '' ? null : Number(form.weight_kg),
        volume_cbm: form.volume_cbm === '' ? null : Number(form.volume_cbm),
        container_type: form.container_type.trim() || null,
        mode_type: form.mode_type || null,
        supervisor_id: form.supervisor_id || null,
        assigned_person_id: form.assigned_person_id || null,
        notes: form.notes.trim() || null,
        vendor_ids: form.vendor_ids,
        created_by: user.id,
        status: 'booked',
      }) as Awaited<ReturnType<typeof createJob>> & {
        credit_warning?: { message: string };
      };
      toast.success(`Job ${job.job_number} created`);
      if (job.credit_warning?.message) {
        toast.warning(job.credit_warning.message, { duration: 8000 });
      }
      router.push(`/dashboard/jobs/${job.id}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create job');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/jobs">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Job / Shipment</h1>
          <p className="text-sm text-muted-foreground">Created from a Closed Won opportunity</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold">Commercial link</h2>
          <div className="space-y-2">
            <Label>Opportunity (Closed Won) *</Label>
            <Select
              value={form.opportunity_id || undefined}
              onValueChange={(v) => setForm((f) => ({ ...f, opportunity_id: v, title: f.title }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select opportunity" />
              </SelectTrigger>
              <SelectContent>
                {opportunityIdParam && opportunity && !oppOptions.find((o: any) => o.id === opportunity.id) && (
                  <SelectItem value={opportunity.id}>{opportunity.title}</SelectItem>
                )}
                {oppOptions.map((o: any) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {opportunity?.buyer && (
              <p className="text-xs text-muted-foreground">
                Buyer: {opportunity.buyer.buyer_name}
                {opportunity.quotations?.[0]
                  ? ` · Quotation: ${opportunity.quotations[0].quotation_number}`
                  : ''}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Shipment title"
            />
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h2 className="font-semibold">Route & cargo</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Origin</Label>
              <Input
                value={form.origin}
                onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                placeholder="e.g. Singapore"
              />
            </div>
            <div className="space-y-2">
              <Label>Destination</Label>
              <Input
                value={form.destination}
                onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                placeholder="e.g. Rotterdam"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select
                value={form.mode_type || 'none'}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, mode_type: v === 'none' ? '' : (v as JobModeType) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not set</SelectItem>
                  {(Object.keys(JOB_MODE_LABELS) as JobModeType[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {JOB_MODE_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Weight (kg)</Label>
              <Input
                type="number"
                step="0.001"
                value={form.weight_kg}
                onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Volume (CBM)</Label>
              <Input
                type="number"
                step="0.001"
                value={form.volume_cbm}
                onChange={(e) => setForm((f) => ({ ...f, volume_cbm: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Container / equipment type</Label>
            <Input
              value={form.container_type}
              onChange={(e) => setForm((f) => ({ ...f, container_type: e.target.value }))}
              placeholder="e.g. 40HC, LCL, ULD"
            />
          </div>
          <div className="space-y-2">
            <Label>Cargo details</Label>
            <Textarea
              rows={3}
              value={form.cargo_description}
              onChange={(e) => setForm((f) => ({ ...f, cargo_description: e.target.value }))}
            />
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h2 className="font-semibold">Assignment</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select
                value={form.assigned_person_id || 'none'}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, assigned_person_id: v === 'none' ? '' : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Supervisor</Label>
              <Select
                value={form.supervisor_id || 'none'}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, supervisor_id: v === 'none' ? '' : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Supervisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Executing vendor(s)</Label>
            <Select
              value="add"
              onValueChange={(v) => {
                if (v === 'add') return;
                setForm((f) =>
                  f.vendor_ids.includes(v) ? f : { ...f, vendor_ids: [...f.vendor_ids, v] }
                );
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add" disabled>
                  Add vendor…
                </SelectItem>
                {vendors.map((v: any) => (
                  <SelectItem key={v.id} value={v.id} disabled={form.vendor_ids.includes(v.id)}>
                    {v.vendor_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.vendor_ids.length > 0 && (
              <ul className="flex flex-wrap gap-2 pt-1">
                {form.vendor_ids.map((id) => {
                  const v = vendors.find((x: any) => x.id === id);
                  return (
                    <li key={id}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            vendor_ids: f.vendor_ids.filter((x) => x !== id),
                          }))
                        }
                      >
                        {v?.vendor_name || id} ×
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/jobs">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Job
          </Button>
        </div>
      </form>
    </div>
  );
}
