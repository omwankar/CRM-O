'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/auth';
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
  EmptyContent
} from '@/components/ui/empty';

interface Membership {
  id: string;
  organization_name: string;
  membership_id: string;
  membership_level: string;
  join_date: string;
  renewal_date: string;
}

export default function MembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [filteredMemberships, setFilteredMemberships] = useState<Membership[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  const isAdmin = role !== 'user';

  useEffect(() => {
    fetchMemberships();
    fetchRole();
  }, []);

  useEffect(() => {
    const filtered = memberships.filter(
      (mem) =>
        mem.organization_name.toLowerCase().includes(search.toLowerCase()) ||
        mem.membership_id.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredMemberships(filtered);
  }, [search, memberships]);

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

  const fetchMemberships = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;

      setMemberships(data || []);
    } catch (error) {
      console.error('Failed to fetch memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;

    if (!confirm('Are you sure you want to delete this membership?')) return;

    try {
      const { error } = await supabase
        .from('memberships')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMemberships((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error('Failed to delete membership:', error);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
  };

  return (
    <div className="page-shell">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Memberships</h1>
          <p className="page-subtitle">
            {isAdmin
              ? 'Manage organization memberships'
              : 'View organization memberships'}
          </p>
        </div>

        {/* ✅ ADMIN ONLY */}
        {isAdmin && (
          <Link href="/dashboard/memberships/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Membership
            </Button>
          </Link>
        )}
      </div>

      {/* SEARCH */}
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

      {/* CONTENT */}
      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="surface-card p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
            </Card>
          ))}
        </div>

      ) : filteredMemberships.length === 0 ? (

        /* EMPTY */
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>

            <EmptyTitle>No memberships yet</EmptyTitle>

            <EmptyDescription>
              {isAdmin
                ? 'Create your first membership'
                : 'No membership data available'}
            </EmptyDescription>
          </EmptyHeader>

          {/* ✅ ADMIN ONLY */}
          {isAdmin && (
            <EmptyContent>
              <Link href="/dashboard/memberships/new">
                <Button>Add Membership</Button>
              </Link>
            </EmptyContent>
          )}
        </Empty>

      ) : (

        /* LIST */
        <div className="grid gap-4">
          {filteredMemberships.map((mem) => (
            <Card key={mem.id} className="surface-card p-6">

              <div className="flex justify-between">

                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {mem.organization_name}
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    Level: {mem.membership_level}
                  </p>

                  <p className="text-sm text-muted-foreground mb-2">
                    Member ID: {mem.membership_id}
                  </p>

                  <div className="flex gap-6 text-sm mt-2">
                    <span>
                      Joined: {formatDate(mem.join_date)}
                    </span>
                    <span>
                      Expiry: {formatDate(mem.renewal_date)}
                    </span>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2">

                  {/* ✅ ADMIN ONLY */}
                  {isAdmin && (
                    <>
                      <Link href={`/dashboard/memberships/${mem.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(mem.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </>
                  )}

                </div>

              </div>

            </Card>
          ))}
        </div>

      )}

    </div>
  );
}