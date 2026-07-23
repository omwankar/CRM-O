'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Briefcase, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CanWrite } from '@/components/auth/Can';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';
import { deletePartnership, getPartnerships } from '@/lib/api/partnerships';

export default function PartnersPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['partnerships', q],
    queryFn: () => getPartnerships({ search: q || undefined, limit: 100 }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePartnership(id),
    onSuccess: () => {
      toast.success('Partner deleted');
      qc.invalidateQueries({ queryKey: ['partnerships'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const partners = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[32px] font-medium text-foreground">Partners</h1>
          <p className="text-[14px] text-muted-foreground">
            Co-loaders, customs agents, and logistics partners linked to Jobs
          </p>
        </div>
        <CanWrite>
          <Button onClick={() => router.push('/dashboard/partnerships/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Partner
          </Button>
        </CanWrite>
      </div>

      <div className="flex gap-2 max-w-md">
        <Input
          placeholder="Search partners…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setQ(search.trim());
          }}
        />
        <Button variant="outline" onClick={() => setQ(search.trim())}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : partners.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Briefcase />
            </EmptyMedia>
            <EmptyTitle>No partners yet</EmptyTitle>
            <EmptyDescription>Add a partner to assign them as co-loader/agent on Jobs.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CanWrite>
              <Button onClick={() => router.push('/dashboard/partnerships/new')}>
                <Plus className="h-4 w-4 mr-2" />
                New Partner
              </Button>
            </CanWrite>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-3">
          {partners.map((p) => {
            const type = p.partnership_type || p.partner_type;
            const org = p.partner_company_name || p.company?.name;
            return (
              <Card key={p.id} className="p-4 hover:bg-muted/20 transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Link href={`/dashboard/partnerships/${p.id}`} className="min-w-0 flex-1">
                    <h3 className="font-medium text-foreground hover:underline">
                      {org || p.partner_name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {[type, p.contact_person || p.partner_name, p.contact_email]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {p.company?.name ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        Company: {p.company.name}
                      </p>
                    ) : null}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-xs rounded-md border px-2 py-1 text-muted-foreground">
                      {p.status || 'active'}
                    </span>
                    <CanWrite>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Soft-delete this partner?')) deleteMut.mutate(p.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CanWrite>
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
