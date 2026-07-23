'use client';

import { useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Building2, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCompanies, getCompanyStats } from '@/lib/api/companies';
import {
  COMPANY_TYPE_BADGE,
  COMPANY_TYPE_LABELS,
  COMPANY_TYPES_ORDER,
  type CompanyType,
} from '@/types/companies';

export default function CompaniesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [typeFilter, setTypeFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['companies', typeFilter, debouncedSearch],
    queryFn: () =>
      getCompanies({
        type: typeFilter,
        search: debouncedSearch || undefined,
        limit: 50,
      }),
  });

  const { data: stats } = useQuery({
    queryKey: ['company-stats'],
    queryFn: getCompanyStats,
  });

  const rows = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground mt-1">
            Org directory — link Buyers and Vendors when the same company wears both hats.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/companies/new">
            <Plus className="w-4 h-4 mr-2" />
            New company
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-semibold">{stats?.total ?? '—'}</p>
        </Card>
        {COMPANY_TYPES_ORDER.map((t) => (
          <Card key={t} className="p-4">
            <p className="text-xs text-muted-foreground">{COMPANY_TYPE_LABELS[t]}</p>
            <p className="text-2xl font-semibold">{stats?.by_type?.[t] ?? 0}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name, industry, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {COMPANY_TYPES_ORDER.map((t) => (
              <SelectItem key={t} value={t}>
                {COMPANY_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading companies…</p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
            <Building2 className="h-8 w-8 opacity-40" />
            <p>No companies yet. Add a prospect or link existing buyers/vendors.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map((c) => (
              <li
                key={c.id}
                className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3 hover:bg-muted/40"
                onClick={() => router.push(`/dashboard/companies/${c.id}`)}
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[c.industry, c.city, c.country].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {(c.company_types || []).map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className={COMPANY_TYPE_BADGE[t as CompanyType] || ''}
                    >
                      {COMPANY_TYPE_LABELS[t as CompanyType] || t}
                    </Badge>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
