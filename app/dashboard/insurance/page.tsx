'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Plus, Search, Edit2, Trash2, Shield } from 'lucide-react';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent
} from '@/components/ui/empty'

import { formatUkDate } from '@/lib/date';

interface Insurance {
  id: string;
  policy_number: string | null;
  provider: string | null;
  insurance_type: string | null;
  coverage_amount: number | null;
  start_date: string;
  end_date: string;
  premium: number | null;
}

export default function InsurancePage() {
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [filteredInsurances, setFilteredInsurances] = useState<Insurance[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  const isAdmin = role !== 'user';

  useEffect(() => {
    fetchInsurances();
    fetchRole();
  }, []);

  useEffect(() => {
    const filtered = insurances.filter(
      (ins) =>
        (ins.provider ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (ins.policy_number ?? '').toLowerCase().includes(search.toLowerCase())
    );
    setFilteredInsurances(filtered);
  }, [search, insurances]);

  const fetchRole = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    setRole(data?.role || null);
  };

  const fetchInsurances = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('insurance')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInsurances(data || []);
    } catch (error) {
      console.error('Failed to fetch insurances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;

    if (!confirm('Are you sure you want to delete this insurance?')) return;

    try {
      const { error } = await supabase
        .from('insurance')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInsurances((prev) => prev.filter((i) => i.id !== id));
    } catch (error) {
      console.error('Failed to delete insurance:', error);
    }
  };

  const getStatus = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    return end < today ? 'expired' : 'active';
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '₹0';
    return `₹${value.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Insurance</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? 'Manage insurance policies'
              : 'View insurance policies'}
          </p>
        </div>

        {/* ✅ ADMIN ONLY */}
        {isAdmin && (
          <Link href="/dashboard/insurance/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Insurance Policy
            </Button>
          </Link>
        )}
      </div>

      {/* SEARCH */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by provider or policy number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 bg-transparent"
          />
        </div>
      </Card>

      {/* LOADING */}
      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </Card>
          ))}
        </div>

      ) : filteredInsurances.length === 0 ? (

        /* EMPTY */
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Shield />
            </EmptyMedia>

            <EmptyTitle>No insurance policies yet</EmptyTitle>

            <EmptyDescription>
              {isAdmin
                ? 'Create your first insurance policy to get started'
                : 'No insurance data available'}
            </EmptyDescription>
          </EmptyHeader>

          {/* ✅ ADMIN ONLY */}
          {isAdmin && (
            <EmptyContent>
              <Link href="/dashboard/insurance/new">
                <Button>Add Insurance</Button>
              </Link>
            </EmptyContent>
          )}
        </Empty>

      ) : (

        /* LIST */
        <div className="grid gap-4">
          {filteredInsurances.map((ins) => {
            const status = getStatus(ins.end_date);

            return (
              <Card key={ins.id} className="p-6">
                <div className="flex items-start justify-between">

                  <div className="flex-1">

                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {ins.provider || 'N/A'}
                      </h3>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(status)}`}
                      >
                        {status}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      Type: {ins.insurance_type || 'N/A'}
                    </p>

                    <p className="text-sm text-muted-foreground mb-3">
                      Policy #: {ins.policy_number || 'N/A'}
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Coverage: {formatCurrency(ins.coverage_amount)}
                      </span>

                      <span className="text-muted-foreground">
                        Premium: {formatCurrency(ins.premium)}
                      </span>

                      <span className="text-muted-foreground">
                        Start:{' '}
                        {ins.start_date
                          ? formatUkDate(ins.start_date)
                          : 'N/A'}
                      </span>

                      <span className="text-muted-foreground">
                        Expires:{' '}
                        {ins.end_date
                          ? formatUkDate(ins.end_date)
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2">

                    {/* ✅ ADMIN ONLY */}
                    {isAdmin && (
                      <>
                        <Link href={`/dashboard/insurance/${ins.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </Link>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(ins.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </>
                    )}

                  </div>

                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}