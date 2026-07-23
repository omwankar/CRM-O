'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createCompany, type CompanyInput } from '@/lib/api/companies';
import {
  COMPANY_TYPE_LABELS,
  COMPANY_TYPES_ORDER,
  type CompanyType,
} from '@/types/companies';

export default function NewCompanyPage() {
  const router = useRouter();
  const [form, setForm] = useState<CompanyInput>({
    name: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    industry: '',
    website: '',
    company_types: ['prospect'],
    notes: '',
  });

  const toggleType = (t: CompanyType) => {
    setForm((f) => {
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
      createCompany({
        ...form,
        name: form.name.trim(),
        address: form.address?.trim() || null,
        city: form.city?.trim() || null,
        state: form.state?.trim() || null,
        postal_code: form.postal_code?.trim() || null,
        country: form.country?.trim() || null,
        industry: form.industry?.trim() || null,
        website: form.website?.trim() || null,
        notes: form.notes?.trim() || null,
        company_types: form.company_types?.length ? form.company_types : ['prospect'],
      }),
    onSuccess: (c) => {
      toast.success('Company created');
      router.push(`/dashboard/companies/${c.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/companies">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New company</h1>
          <p className="text-sm text-muted-foreground">
            Track an organization before (or without) creating a Buyer or Vendor.
          </p>
        </div>
      </div>

      <Card className="space-y-4 p-6">
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Organization name"
          />
        </div>

        <div className="space-y-2">
          <Label>Types (multi-select)</Label>
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
              onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input
              value={form.website || ''}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              placeholder="https://"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Address</Label>
          <Textarea
            rows={2}
            value={form.address || ''}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>City</Label>
            <Input
              value={form.city || ''}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>State / region</Label>
            <Input
              value={form.state || ''}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Postal code</Label>
            <Input
              value={form.postal_code || ''}
              onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Input
              value={form.country || ''}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
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

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/companies">Cancel</Link>
          </Button>
          <Button
            disabled={!form.name.trim() || saveMut.isPending}
            onClick={() => saveMut.mutate()}
          >
            {saveMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create company
          </Button>
        </div>
      </Card>
    </div>
  );
}
