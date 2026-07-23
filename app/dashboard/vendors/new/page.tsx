'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { createVendor } from '@/lib/api/vendors';
import { getCompanies } from '@/lib/api/companies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewVendorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetCompanyId = searchParams.get('company_id') || '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    vendor_name: '',
    vendor_type: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    payment_terms: '',
    status: 'active',
    vendor_portal_link: '',
    company_id: presetCompanyId,
  });

  useEffect(() => {
    if (presetCompanyId) setFormData((prev) => ({ ...prev, company_id: presetCompanyId }));
  }, [presetCompanyId]);

  const { data: companiesData } = useQuery({
    queryKey: ['companies-vendor-form'],
    queryFn: () => getCompanies({ limit: 200 }),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { status: _status, ...rest } = formData;
      await createVendor({
        ...rest,
        company_id: formData.company_id || null,
      });

      router.push('/dashboard/vendors');
    } catch (err: any) {
      setError(err.message || 'Failed to create vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/vendors" className="flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Vendors
      </Link>

      <Card className="p-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Add New Vendor</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <h3 className="mb-3 text-sm font-semibold">Card Information</h3>
            <p className="text-xs text-muted-foreground">
              These fields are shown directly on Vendor cards and portal summary.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FieldGroup>
              <FieldLabel>Vendor Name *</FieldLabel>
              <Input name="vendor_name" value={formData.vendor_name} onChange={handleChange} required />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Company (directory)</FieldLabel>
              <Select
                value={formData.company_id || 'none'}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, company_id: v === 'none' ? '' : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional link" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No company link</SelectItem>
                  {(companiesData?.data || []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Contact Person *</FieldLabel>
              <Input name="contact_person" value={formData.contact_person} onChange={handleChange} required />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Contact Email</FieldLabel>
              <Input name="contact_email" type="email" value={formData.contact_email} onChange={handleChange} />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Contact Phone</FieldLabel>
              <Input name="contact_phone" value={formData.contact_phone} onChange={handleChange} />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Vendor Type *</FieldLabel>
              <Input name="vendor_type" value={formData.vendor_type} onChange={handleChange} required />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Payment Terms</FieldLabel>
              <Input name="payment_terms" value={formData.payment_terms} onChange={handleChange} />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Vendor Portal Link</FieldLabel>
              <Input name="vendor_portal_link" value={formData.vendor_portal_link} onChange={handleChange} />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Address</FieldLabel>
              <Input name="address" value={formData.address} onChange={handleChange} />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>City</FieldLabel>
              <Input name="city" value={formData.city} onChange={handleChange} />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>State</FieldLabel>
              <Input name="state" value={formData.state} onChange={handleChange} />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Postal Code</FieldLabel>
              <Input name="postal_code" value={formData.postal_code} onChange={handleChange} />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Country</FieldLabel>
              <Input name="country" value={formData.country} onChange={handleChange} />
            </FieldGroup>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Create Vendor'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/dashboard/vendors')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
