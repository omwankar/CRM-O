'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewBuyerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    buyer_name: '',
    company_type: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    credit_limit: '',
    pipeline_value: '',
    buyer_portal_link: '',
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
      const data = {
        ...formData,
        credit_limit: formData.credit_limit
          ? parseFloat(formData.credit_limit)
          : null,
        pipeline_value: formData.pipeline_value
          ? parseFloat(formData.pipeline_value)
          : null,
      };

      const { error } = await supabase
        .from('buyers')
        .insert([data]);

      if (error) throw error;

      router.push('/dashboard/buyers');
    } catch (err: any) {
      setError(err.message || 'Failed to create buyer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/buyers" className="flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Buyers
      </Link>

      <Card className="p-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Add New Buyer</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <h3 className="mb-3 text-sm font-semibold">Card Information</h3>
            <p className="text-xs text-muted-foreground">
              These fields are shown directly on Buyer cards and portal summary.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FieldGroup>
              <FieldLabel>Buyer Name *</FieldLabel>
              <Input name="buyer_name" value={formData.buyer_name} onChange={handleChange} required />
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
              <FieldLabel>Company Type *</FieldLabel>
              <Input name="company_type" value={formData.company_type} onChange={handleChange} required />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Pipeline Value</FieldLabel>
              <Input
                name="pipeline_value"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.pipeline_value}
                onChange={handleChange}
              />
            </FieldGroup>
          </div>

          <FieldGroup>
            <FieldLabel>Address</FieldLabel>
            <Input name="address" value={formData.address} onChange={handleChange} />
          </FieldGroup>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Input name="city" placeholder="City" value={formData.city} onChange={handleChange} />
            <Input name="state" placeholder="State" value={formData.state} onChange={handleChange} />
            <Input name="postal_code" placeholder="Postal Code" value={formData.postal_code} onChange={handleChange} />
            <Input name="country" placeholder="Country" value={formData.country} onChange={handleChange} />
          </div>

          <FieldGroup>
            <FieldLabel>Credit Limit</FieldLabel>
            <Input
              name="credit_limit"
              type="number"
              step="0.01"
              value={formData.credit_limit}
              onChange={handleChange}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Buyer Portal Link</FieldLabel>
            <Input
              name="buyer_portal_link"
              type="url"
              placeholder="https://buyer-portal.example.com"
              value={formData.buyer_portal_link}
              onChange={handleChange}
            />
          </FieldGroup>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Buyer'}
            </Button>

            <Link href="/dashboard/buyers">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>

        </form>
      </Card>
    </div>
  );
}