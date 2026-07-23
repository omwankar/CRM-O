'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Edit2, Package, Save, X } from 'lucide-react';
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
import { ActivityTimeline } from '@/components/activities/ActivityTimeline';
import { CanWrite } from '@/components/auth/Can';
import { JobStatusPill } from '@/components/jobs/JobStatusPill';
import {
  getPartnership,
  getPartnershipJobs,
  updatePartnership,
  PARTNER_TYPES,
  type PartnershipInput,
} from '@/lib/api/partnerships';
import { getCompanies } from '@/lib/api/companies';
import type { JobStatus } from '@/types/jobs';

type Tab = 'overview' | 'jobs' | 'activity';

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<PartnershipInput>>({});

  const { data: partner, isLoading } = useQuery({
    queryKey: ['partnership', id],
    queryFn: () => getPartnership(id!),
    enabled: !!id,
  });

  const { data: jobsRes } = useQuery({
    queryKey: ['partnership-jobs', id],
    queryFn: () => getPartnershipJobs(id!),
    enabled: !!id && tab === 'jobs',
  });

  const { data: companiesRes } = useQuery({
    queryKey: ['companies', 'partner-detail'],
    queryFn: () => getCompanies({ limit: 200 }),
    enabled: editing,
  });

  const companies = companiesRes?.data || [];
  const assignedJobs = jobsRes?.data || [];

  const saveMut = useMutation({
    mutationFn: () =>
      updatePartnership(id!, {
        ...form,
        partner_type: form.partner_type || form.partnership_type,
        partnership_type: form.partnership_type || form.partner_type,
        end_date: form.end_date || null,
        company_id: form.company_id || null,
      }),
    onSuccess: () => {
      toast.success('Partner updated');
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['partnership', id] });
      qc.invalidateQueries({ queryKey: ['partnerships'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !partner) {
    return <p className="p-6 text-sm text-muted-foreground">Loading partner…</p>;
  }

  const type = partner.partnership_type || partner.partner_type;
  const title = partner.partner_company_name || partner.partner_name;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button variant="ghost" onClick={() => router.push('/dashboard/partnerships')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Partners
      </Button>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {[type, partner.contact_person].filter(Boolean).join(' · ') || '—'}
            </p>
            {partner.company?.id ? (
              <p className="mt-1 text-sm">
                Company:{' '}
                <Link
                  href={`/dashboard/companies/${partner.company.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {partner.company.name}
                </Link>
              </p>
            ) : null}
            {partner.also_vendor && (partner.sibling_vendors || []).length > 0 ? (
              <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                Also a vendor:{' '}
                {(partner.sibling_vendors || []).map((v, i) => (
                  <span key={v.id}>
                    {i > 0 ? ', ' : ''}
                    <Link href={`/dashboard/vendors/${v.id}`} className="font-medium underline">
                      {v.vendor_name}
                    </Link>
                  </span>
                ))}
              </p>
            ) : null}
          </div>
          <CanWrite>
            <Button
              variant="outline"
              onClick={() => {
                setForm({
                  partner_name: partner.partner_name,
                  partner_company_name: partner.partner_company_name,
                  partner_type: type || 'Logistics',
                  partnership_type: type || 'Logistics',
                  contact_person: partner.contact_person,
                  contact_email: partner.contact_email,
                  contact_phone: partner.contact_phone,
                  start_date: partner.start_date?.slice?.(0, 10) || partner.start_date,
                  end_date: partner.end_date ? String(partner.end_date).slice(0, 10) : '',
                  description: partner.description,
                  terms_url: partner.terms_url,
                  status: (partner.status as any) || 'active',
                  company_id: partner.company_id || '',
                });
                setEditing(true);
              }}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </CanWrite>
        </div>

        <div className="flex gap-1 border-b mb-6">
          {(['overview', 'jobs', 'activity'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'jobs' ? 'Assigned jobs' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {editing && (
          <Card className="p-4 mb-6 bg-muted/40 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Partner name</Label>
                <Input
                  value={form.partner_name || ''}
                  onChange={(e) => setForm((f) => ({ ...f, partner_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Organisation</Label>
                <Input
                  value={form.partner_company_name || ''}
                  onChange={(e) => setForm((f) => ({ ...f, partner_company_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.partner_type || 'Logistics'}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, partner_type: v, partnership_type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PARTNER_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Company link</Label>
                <Select
                  value={form.company_id || 'none'}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, company_id: v === 'none' ? '' : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {companies.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contact person</Label>
                <Input
                  value={form.contact_person || ''}
                  onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={form.contact_email || ''}
                  onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Start date</Label>
                <Input
                  type="date"
                  value={form.start_date || ''}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End date</Label>
                <Input
                  type="date"
                  value={form.end_date || ''}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description / terms</Label>
              <Textarea
                rows={3}
                value={form.description || ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {tab === 'overview' && (
          <div className="grid gap-6 sm:grid-cols-2 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold">Contact</h3>
              <p>
                <span className="text-muted-foreground">Person:</span> {partner.contact_person || '—'}
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span> {partner.contact_email || '—'}
              </p>
              <p>
                <span className="text-muted-foreground">Phone:</span> {partner.contact_phone || '—'}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Relationship</h3>
              <p>
                <span className="text-muted-foreground">Type:</span> {type || '—'}
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span> {partner.status || 'active'}
              </p>
              <p>
                <span className="text-muted-foreground">Start:</span>{' '}
                {partner.start_date ? new Date(partner.start_date).toLocaleDateString() : '—'}
              </p>
              <p>
                <span className="text-muted-foreground">End:</span>{' '}
                {partner.end_date ? new Date(partner.end_date).toLocaleDateString() : '—'}
              </p>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <h3 className="font-semibold">Description / terms</h3>
              <p className="whitespace-pre-wrap">{partner.description || '—'}</p>
              {partner.terms_url ? (
                <a
                  href={partner.terms_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {partner.terms_url}
                </a>
              ) : null}
            </div>
          </div>
        )}

        {tab === 'jobs' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Jobs where this partner is assigned as co-loader / agent.
            </p>
            {assignedJobs.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
                <Package className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No assigned jobs yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">Job</th>
                      <th className="px-3 py-2 font-medium">Lane</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedJobs.map((row) => (
                      <tr
                        key={row.link_id}
                        className="border-t hover:bg-muted/30 cursor-pointer"
                        onClick={() => router.push(`/dashboard/jobs/${row.job.id}`)}
                      >
                        <td className="px-3 py-2">
                          <div className="font-mono text-xs text-muted-foreground">
                            {row.job.job_number}
                          </div>
                          <div className="font-medium">{row.job.title}</div>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {row.job.origin || row.job.destination
                            ? `${row.job.origin || '—'} → ${row.job.destination || '—'}`
                            : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <JobStatusPill status={row.job.status as JobStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'activity' && <ActivityTimeline entityType="partnership" entityId={id!} />}
      </Card>
    </div>
  );
}
