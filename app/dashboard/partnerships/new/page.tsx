'use client';

import { Suspense, useEffect, useState } from 'react';
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
import { createPartnership, PARTNER_TYPES } from '@/lib/api/partnerships';
import { getCompanies } from '@/lib/api/companies';

function NewPartnerPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetCompanyId = searchParams.get('company_id') || '';
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    partner_name: '',
    partner_company_name: '',
    partner_type: 'Logistics',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    description: '',
    terms_url: '',
    status: 'active' as 'active' | 'inactive' | 'on_hold',
    company_id: presetCompanyId,
  });

  const { data: companiesRes } = useQuery({
    queryKey: ['companies', 'partner-form'],
    queryFn: () => getCompanies({ limit: 200 }),
  });

  const companies = companiesRes?.data || [];

  useEffect(() => {
    if (presetCompanyId) {
      setForm((f) => ({ ...f, company_id: presetCompanyId }));
      const co = companies.find((c: any) => c.id === presetCompanyId);
      if (co && !form.partner_company_name) {
        setForm((f) => ({
          ...f,
          company_id: presetCompanyId,
          partner_company_name: co.name,
          partner_name: f.partner_name || co.name,
        }));
      }
    }
  }, [presetCompanyId, companies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.partner_name.trim()) {
      toast.error('Partner name is required');
      return;
    }
    if (!form.start_date) {
      toast.error('Start date is required');
      return;
    }
    if (form.end_date && form.end_date < form.start_date) {
      toast.error('End date cannot be before start date');
      return;
    }

    setSaving(true);
    try {
      const partner = await createPartnership({
        partner_name: form.partner_name.trim(),
        partner_company_name: form.partner_company_name.trim() || null,
        partner_type: form.partner_type,
        partnership_type: form.partner_type,
        contact_person: form.contact_person.trim() || null,
        contact_email: form.contact_email.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        start_date: form.start_date,
        end_date: form.end_date || null,
        description: form.description.trim() || null,
        terms_url: form.terms_url.trim() || null,
        status: form.status,
        company_id: form.company_id || null,
      });
      toast.success('Partner created');
      router.push(`/dashboard/partnerships/${partner.id}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create partner');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/partnerships">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Partner</h1>
          <p className="text-sm text-muted-foreground">
            Link a Company when the org already exists (avoids duplicating address/website).
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-5 space-y-4">
          <div className="space-y-2">
            <Label>Company (optional)</Label>
            <Select
              value={form.company_id || 'none'}
              onValueChange={(v) => {
                if (v === 'none') {
                  setForm((f) => ({ ...f, company_id: '' }));
                  return;
                }
                const co = companies.find((c: any) => c.id === v);
                setForm((f) => ({
                  ...f,
                  company_id: v,
                  partner_company_name: co?.name || f.partner_company_name,
                  partner_name: f.partner_name || co?.name || '',
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Link to company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No company link</SelectItem>
                {companies.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Partner / display name *</Label>
              <Input
                value={form.partner_name}
                onChange={(e) => setForm((f) => ({ ...f, partner_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Organisation name</Label>
              <Input
                value={form.partner_company_name}
                onChange={(e) => setForm((f) => ({ ...f, partner_company_name: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Partner type</Label>
              <Select
                value={form.partner_type}
                onValueChange={(v) => setForm((f) => ({ ...f, partner_type: v }))}
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
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as 'active' | 'inactive' | 'on_hold' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_hold">On hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Contact person</Label>
              <Input
                value={form.contact_person}
                onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={form.contact_phone}
                onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Relationship start *</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description / terms</Label>
            <Textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Terms URL</Label>
            <Input
              value={form.terms_url}
              onChange={(e) => setForm((f) => ({ ...f, terms_url: e.target.value }))}
              placeholder="https://…"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/partnerships">Cancel</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Partner
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

export default function NewPartnerPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <NewPartnerPageInner />
    </Suspense>
  );
}
