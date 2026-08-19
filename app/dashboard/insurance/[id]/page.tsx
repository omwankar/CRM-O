'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getInsurancePolicy, updateInsurance } from '@/lib/api/insurance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditInsurancePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    policy_number: '',
    provider: '',
    insurance_type: '',
    coverage_amount: '',
    premium: '',
    start_date: '',
    end_date: '',
    agent_name: '',
    agent_phone: '',
  });

  useEffect(() => {
    fetchInsurance();
  }, [id]);

  const fetchInsurance = async () => {
    try {
      const data = await getInsurancePolicy(id);
      if (data) {
        setFormData({
          policy_number: data.policy_number || '',
          provider: data.provider || data.provider_name || '',
          insurance_type: data.insurance_type || data.policy_type || '',
          coverage_amount: data.coverage_amount != null ? String(data.coverage_amount) : '',
          premium: data.premium != null ? String(data.premium) : data.premium_amount != null ? String(data.premium_amount) : '',
          start_date: data.start_date ? String(data.start_date).slice(0, 10) : '',
          end_date: data.end_date ? String(data.end_date).slice(0, 10) : data.expiry_date ? String(data.expiry_date).slice(0, 10) : '',
          agent_name: data.agent_name || '',
          agent_phone: data.agent_phone || '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch insurance');
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
      await updateInsurance(id, {
        policy_number: formData.policy_number,
        provider: formData.provider,
        insurance_type: formData.insurance_type,
        coverage_amount: formData.coverage_amount ? parseFloat(formData.coverage_amount) : undefined,
        premium: formData.premium ? parseFloat(formData.premium) : undefined,
        start_date: formData.start_date,
        end_date: formData.end_date,
        agent_name: formData.agent_name || undefined,
        agent_phone: formData.agent_phone || undefined,
      });
      router.push('/dashboard/insurance');
    } catch (err: any) {
      setError(err.message || 'Failed to update insurance');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/insurance" className="flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Insurance
      </Link>

      <Card className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">Edit Insurance Policy</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <FieldGroup>
            <FieldLabel htmlFor="provider">Insurance Provider *</FieldLabel>
            <Input
              id="provider"
              name="provider"
              value={formData.provider}
              onChange={handleChange}
              required
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="insurance_type">Insurance Type *</FieldLabel>
            <Input
              id="insurance_type"
              name="insurance_type"
              value={formData.insurance_type}
              onChange={handleChange}
              required
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="policy_number">Policy Number *</FieldLabel>
            <Input
              id="policy_number"
              name="policy_number"
              value={formData.policy_number}
              onChange={handleChange}
              required
            />
          </FieldGroup>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FieldGroup>
              <FieldLabel htmlFor="coverage_amount">Coverage Amount *</FieldLabel>
              <Input
                id="coverage_amount"
                name="coverage_amount"
                type="number"
                step="0.01"
                value={formData.coverage_amount}
                onChange={handleChange}
                required
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="premium">Annual Premium *</FieldLabel>
              <Input
                id="premium"
                name="premium"
                type="number"
                step="0.01"
                value={formData.premium}
                onChange={handleChange}
                required
              />
            </FieldGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FieldGroup>
              <FieldLabel htmlFor="start_date">Start Date *</FieldLabel>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                required
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="end_date">End Date *</FieldLabel>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                required
              />
            </FieldGroup>
          </div>

          <FieldGroup>
            <FieldLabel htmlFor="agent_name">Agent Name</FieldLabel>
            <Input
              id="agent_name"
              name="agent_name"
              value={formData.agent_name}
              onChange={handleChange}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="agent_phone">Agent Phone</FieldLabel>
            <Input
              id="agent_phone"
              name="agent_phone"
              value={formData.agent_phone}
              onChange={handleChange}
            />
          </FieldGroup>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Link href="/dashboard/insurance">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
