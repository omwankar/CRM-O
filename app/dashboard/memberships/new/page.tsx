'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMembership } from '@/lib/api/memberships';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewMembershipPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    organization_name: '',
    membership_type: '',
    membership_number: '',
    join_date: '',
    renewal_date: '',
    membership_fee: '',
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
      await createMembership({
        ...formData,
        membership_fee: formData.membership_fee ? parseFloat(formData.membership_fee) : undefined,
      });
      router.push('/dashboard/memberships');
    } catch (err: any) {
      setError(err.message || 'Failed to create membership');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/memberships" className="flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Memberships
      </Link>

      <Card className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">Add New Membership</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <FieldGroup>
            <FieldLabel htmlFor="organization_name">Organization Name *</FieldLabel>
            <Input
              id="organization_name"
              name="organization_name"
              placeholder="e.g., Chamber of Commerce"
              value={formData.organization_name}
              onChange={handleChange}
              required
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="membership_type">Membership Type *</FieldLabel>
            <Input
              id="membership_type"
              name="membership_type"
              placeholder="e.g., Gold, Silver, Bronze"
              value={formData.membership_type}
              onChange={handleChange}
              required
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="membership_number">Membership Number *</FieldLabel>
            <Input
              id="membership_number"
              name="membership_number"
              placeholder="e.g., MEM-2024-001"
              value={formData.membership_number}
              onChange={handleChange}
              required
            />
          </FieldGroup>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FieldGroup>
              <FieldLabel htmlFor="join_date">Join Date *</FieldLabel>
              <Input
                id="join_date"
                name="join_date"
                type="date"
                value={formData.join_date}
                onChange={handleChange}
                required
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="renewal_date">Renewal Date *</FieldLabel>
              <Input
                id="renewal_date"
                name="renewal_date"
                type="date"
                value={formData.renewal_date}
                onChange={handleChange}
                required
              />
            </FieldGroup>
          </div>

          <FieldGroup>
            <FieldLabel htmlFor="membership_fee">Membership Fee</FieldLabel>
            <Input
              id="membership_fee"
              name="membership_fee"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.membership_fee}
              onChange={handleChange}
            />
          </FieldGroup>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Membership'}
            </Button>
            <Link href="/dashboard/memberships">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
