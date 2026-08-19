'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getMembership, updateMembership } from '@/lib/api/memberships';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditMembershipPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    organization_name: '',
    membership_type: '',
    membership_number: '',
    join_date: '',
    renewal_date: '',
    membership_fee: '',
  });

  useEffect(() => {
    if (id) fetchMembership();
  }, [id]);

  const fetchMembership = async () => {
    try {
      const data = await getMembership(id);
      if (data) {
        setFormData({
          organization_name: data.organization_name || '',
          membership_type: data.membership_type || data.membership_level || '',
          membership_number: data.membership_number || data.membership_id || data.member_id || '',
          join_date: data.join_date ? String(data.join_date).split('T')[0] : '',
          renewal_date: data.renewal_date ? String(data.renewal_date).split('T')[0] : '',
          membership_fee: data.membership_fee ? String(data.membership_fee) : '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch membership');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await updateMembership(id, {
        organization_name: formData.organization_name,
        membership_type: formData.membership_type,
        membership_number: formData.membership_number,
        join_date: formData.join_date || undefined,
        renewal_date: formData.renewal_date || undefined,
        membership_fee: formData.membership_fee ? parseFloat(formData.membership_fee) : undefined,
      });

      router.push('/dashboard/memberships');
    } catch (err: any) {
      setError(err.message || 'Failed to update membership');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/memberships"
        className="flex items-center gap-2 text-primary hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Memberships
      </Link>

      <Card className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">
          Edit Membership
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          <FieldGroup>
            <FieldLabel>Organization Name *</FieldLabel>
            <Input
              name="organization_name"
              value={formData.organization_name}
              onChange={handleChange}
              required
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Membership Type *</FieldLabel>
            <Input
              name="membership_type"
              value={formData.membership_type}
              onChange={handleChange}
              required
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Membership Number *</FieldLabel>
            <Input
              name="membership_number"
              value={formData.membership_number}
              onChange={handleChange}
              required
            />
          </FieldGroup>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FieldGroup>
              <FieldLabel>Join Date *</FieldLabel>
              <Input
                type="date"
                name="join_date"
                value={formData.join_date}
                onChange={handleChange}
                required
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Renewal Date *</FieldLabel>
              <Input
                type="date"
                name="renewal_date"
                value={formData.renewal_date}
                onChange={handleChange}
                required
              />
            </FieldGroup>
          </div>

          <FieldGroup>
            <FieldLabel>Membership Fee</FieldLabel>
            <Input
              type="number"
              step="0.01"
              name="membership_fee"
              value={formData.membership_fee}
              onChange={handleChange}
            />
          </FieldGroup>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
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