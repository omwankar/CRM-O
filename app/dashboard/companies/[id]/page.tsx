'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Pencil, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { getCompany, updateCompany } from '@/lib/api/companies';
import {
  COMPANY_TYPE_BADGE,
  COMPANY_TYPE_LABELS,
  COMPANY_TYPES_ORDER,
  type CompanyInput,
  type CompanyType,
} from '@/types/companies';
import { ActivityTimeline } from '@/components/activities/ActivityTimeline';
import { EntityTaskList } from '@/components/tasks/EntityTaskList';

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<CompanyInput> | null>(null);

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: () => getCompany(id!),
    enabled: !!id,
  });

  const startEdit = () => {
    if (!company) return;
    setForm({
      name: company.name,
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      postal_code: company.postal_code || '',
      country: company.country || '',
      industry: company.industry || '',
      website: company.website || '',
      company_types: company.company_types || ['prospect'],
      notes: company.notes || '',
    });
    setEditing(true);
  };

  const toggleType = (t: CompanyType) => {
    setForm((f) => {
      if (!f) return f;
      const cur = f.company_types || [];
      if (cur.includes(t)) {
        const next = cur.filter((x) => x !== t);
        return { ...f, company_types: next.length ? next : (['prospect'] as CompanyType[]) };
      }
      return { ...f, company_types: [...cur, t] };
    });
  };

  const saveMut = useMutation({
    mutationFn: () =>
      updateCompany(id!, {
        ...form,
        name: form?.name?.trim() || '',
        address: form?.address?.trim() || null,
        city: form?.city?.trim() || null,
        state: form?.state?.trim() || null,
        postal_code: form?.postal_code?.trim() || null,
        country: form?.country?.trim() || null,
        industry: form?.industry?.trim() || null,
        website: form?.website?.trim() || null,
        notes: form?.notes?.trim() || null,
        company_types: form?.company_types?.length ? form.company_types : ['prospect'],
      }),
    onSuccess: () => {
      toast.success('Company updated');
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['company', id] });
      qc.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !company) {
    return <p className="p-6 text-sm text-muted-foreground">Loading company…</p>;
  }

  const addressLine = [company.address, company.city, company.state, company.postal_code, company.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/companies">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <div className="mt-2 flex flex-wrap gap-1">
              {(company.company_types || []).map((t) => (
                <Badge key={t} variant="outline" className={COMPANY_TYPE_BADGE[t as CompanyType]}>
                  {COMPANY_TYPE_LABELS[t as CompanyType] || t}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={startEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
              {saveMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        )}
      </div>

      {(company.also_buyer && company.also_vendor) ||
      (company.buyers?.length && company.vendors?.length) ? (
        <Card className="border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
          This company is linked as both a customer and a vendor — shared org record for dual-role
          partners.
        </Card>
      ) : null}

      <Card className="space-y-4 p-6">
        {editing && form ? (
          <>
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name || ''}
                onChange={(e) => setForm((f) => ({ ...f!, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Types</Label>
              <div className="flex flex-wrap gap-2">
                {COMPANY_TYPES_ORDER.map((t) => {
                  const on = (form.company_types || []).includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleType(t)}
                      className={`rounded-md border px-3 py-1.5 text-sm ${
                        on ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {COMPANY_TYPE_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input
                  value={form.industry || ''}
                  onChange={(e) => setForm((f) => ({ ...f!, industry: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={form.website || ''}
                  onChange={(e) => setForm((f) => ({ ...f!, website: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                rows={2}
                value={form.address || ''}
                onChange={(e) => setForm((f) => ({ ...f!, address: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={form.city || ''}
                  onChange={(e) => setForm((f) => ({ ...f!, city: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={form.state || ''}
                  onChange={(e) => setForm((f) => ({ ...f!, state: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Postal code</Label>
                <Input
                  value={form.postal_code || ''}
                  onChange={(e) => setForm((f) => ({ ...f!, postal_code: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={form.country || ''}
                  onChange={(e) => setForm((f) => ({ ...f!, country: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={form.notes || ''}
                onChange={(e) => setForm((f) => ({ ...f!, notes: e.target.value }))}
              />
            </div>
          </>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Industry</dt>
              <dd>{company.industry || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Website</dt>
              <dd>
                {company.website ? (
                  <a
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {company.website}
                  </a>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Address</dt>
              <dd>{addressLine || '—'}</dd>
            </div>
            {company.notes ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Notes</dt>
                <dd className="whitespace-pre-wrap">{company.notes}</dd>
              </div>
            ) : null}
          </dl>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Linked buyers</h2>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/buyers/new?company_id=${company.id}`}>Add buyer</Link>
            </Button>
          </div>
          {(company.buyers || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No buyer records linked.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {(company.buyers || []).map((b) => (
                <li key={b.id} className="px-3 py-2">
                  <Link href={`/dashboard/buyers/${b.id}`} className="font-medium text-blue-600 hover:underline">
                    {b.buyer_name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Linked vendors</h2>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/vendors/new?company_id=${company.id}`}>Add vendor</Link>
            </Button>
          </div>
          {(company.vendors || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No vendor records linked.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {(company.vendors || []).map((v) => (
                <li key={v.id} className="px-3 py-2">
                  <Link href={`/dashboard/vendors/${v.id}`} className="font-medium text-blue-600 hover:underline">
                    {v.vendor_name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Linked partners</h2>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/partnerships/new?company_id=${company.id}`}>Add partner</Link>
            </Button>
          </div>
          {(company.partnerships || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No partner records linked.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {(company.partnerships || []).map((p: any) => (
                <li key={p.id} className="px-3 py-2">
                  <Link
                    href={`/dashboard/partnerships/${p.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {p.partner_company_name || p.partner_name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <ActivityTimeline entityType="company" entityId={company.id} />
      </Card>

      <Card className="p-5">
        <EntityTaskList entityType="company" entityId={company.id} />
      </Card>
    </div>
  );
}
