'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createInsurance } from '@/lib/api/insurance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewInsurancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createInsurance({
        ...formData,
        coverage_amount: formData.coverage_amount ? parseFloat(formData.coverage_amount) : undefined,
        premium: formData.premium ? parseFloat(formData.premium) : undefined,
      });
      router.push('/dashboard/insurance');
    } catch (err: any) {
      setError(err.message || 'Failed to create insurance policy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/insurance" className="flex items-center gap-2 text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Insurance
      </Link>

      <Card className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">Add New Insurance Policy</h1>

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
              placeholder="e.g., State Farm"
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
              placeholder="e.g., General Liability"
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
              placeholder="Policy number"
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
                placeholder="0.00"
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
                placeholder="0.00"
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
              placeholder="Insurance agent name"
              value={formData.agent_name}
              onChange={handleChange}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="agent_phone">Agent Phone</FieldLabel>
            <Input
              id="agent_phone"
              name="agent_phone"
              placeholder="+1 (555) 000-0000"
              value={formData.agent_phone}
              onChange={handleChange}
            />
          </FieldGroup>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Policy'}
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
