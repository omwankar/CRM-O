'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getMemberships, deleteMembership } from '@/lib/api/memberships';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Plus, Search, Edit2, Trash2, Users } from 'lucide-react';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';
import { formatUkDate } from '@/lib/date';

function memberNumber(mem: any) {
  return mem.membership_number || mem.membership_id || mem.member_id || '';
}

function memberLevel(mem: any) {
  return mem.membership_type || mem.membership_level || '';
}

export default function MembershipsPage() {
  const { canWrite } = useCurrentUser();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['memberships'],
    queryFn: () => getMemberships({ limit: 100 }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteMembership(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memberships'] });
      toast.success('Membership deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const memberships = data?.data || [];
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return memberships;
    return memberships.filter((mem: any) => {
      const name = String(mem.organization_name || '').toLowerCase();
      const id = String(memberNumber(mem)).toLowerCase();
      const level = String(memberLevel(mem)).toLowerCase();
      return name.includes(q) || id.includes(q) || level.includes(q);
    });
  }, [search, memberships]);

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return isNaN(d.getTime()) ? 'N/A' : formatUkDate(date);
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Memberships</h1>
          <p className="page-subtitle">
            {canWrite ? 'Manage organization memberships' : 'View organization memberships'}
          </p>
        </div>
        {canWrite && (
          <Link href="/dashboard/memberships/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Membership
            </Button>
          </Link>
        )}
      </div>

      <Card className="surface-card p-4">
        <div className="flex gap-2 items-center">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 bg-transparent"
          />
        </div>
      </Card>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="surface-card p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>No memberships yet</EmptyTitle>
            <EmptyDescription>
              {canWrite ? 'Create your first membership' : 'No membership data available'}
            </EmptyDescription>
          </EmptyHeader>
          {canWrite && (
            <EmptyContent>
              <Link href="/dashboard/memberships/new">
                <Button>Add Membership</Button>
              </Link>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="grid gap-4">
          {filtered.map((mem: any) => (
            <Card key={mem.id} className="surface-card p-6">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{mem.organization_name || 'Membership'}</h3>
                  <p className="text-sm text-muted-foreground">Level: {memberLevel(mem) || '—'}</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Member ID: {memberNumber(mem) || '—'}
                  </p>
                  <div className="flex gap-6 text-sm mt-2">
                    <span>Joined: {formatDate(mem.join_date)}</span>
                    <span>Expiry: {formatDate(mem.renewal_date)}</span>
                  </div>
                </div>
                {canWrite && (
                  <div className="flex gap-2">
                    <Link href={`/dashboard/memberships/${mem.id}`}>
                      <Button variant="ghost" size="sm">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this membership?')) {
                          deleteMut.mutate(mem.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
