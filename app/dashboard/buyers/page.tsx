'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getBuyers } from '@/lib/api/buyers';
import { Plus, Search, LayoutGrid, List, Kanban, ExternalLink, Mail, Phone, Building2 } from 'lucide-react';
import { CanWrite } from '@/components/auth/Can';

type ViewMode = 'card' | 'table' | 'kanban';

export default function BuyersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  const { data: buyersData, isLoading, error } = useQuery({
    queryKey: ['buyers', search],
    queryFn: () => getBuyers({ search }),
  });

  const buyers = buyersData?.data || [];

  const filteredBuyers = search
    ? buyers.filter((b: any) =>
        b.buyer_name?.toLowerCase().includes(search.toLowerCase()) ||
        b.contact_person?.toLowerCase().includes(search.toLowerCase())
      )
    : buyers;

  const pipelineStages = ['Lead', 'Contacted', 'Proposal Sent', 'Negotiating', 'Closed Won', 'Closed Lost'];

  const openBuyerPortal = (buyer: any) => {
    const rawLink = buyer?.buyer_portal_link?.trim();
    if (!rawLink) {
      router.push(`/dashboard/buyers/${buyer.id}`);
      return;
    }

    const normalizedLink = /^https?:\/\//i.test(rawLink) ? rawLink : `https://${rawLink}`;
    window.open(normalizedLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Buyers</h1>
          <p className="text-muted-foreground">Manage buyer relationships and pipeline</p>
        </div>
        <CanWrite>
          <Button onClick={() => router.push('/dashboard/buyers/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Buyer
          </Button>
        </CanWrite>
      </div>

      <Card className="p-4">
        <div className="flex gap-2 items-center">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by buyer name or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 bg-transparent flex-1"
          />
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              <Kanban className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => <Card key={i} className="p-6 animate-pulse h-32" />)}
        </div>
      ) : error ? (
        <Card className="p-6">
          <p className="text-sm text-destructive">Failed to load buyers. Please refresh the page.</p>
        </Card>
      ) : filteredBuyers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No buyers found</p>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineStages.map((stage) => {
            const stageBuyers = filteredBuyers.filter((b: any) => b.pipeline_stages?.[0]?.name === stage);
            return (
              <div key={stage} className="flex-shrink-0 w-72">
                <Card className="p-4 mb-3">
                  <h3 className="font-semibold">{stage}</h3>
                  <p className="text-sm text-muted-foreground">{stageBuyers.length} buyers</p>
                </Card>
                <div className="space-y-3">
                  {stageBuyers.map((buyer: any) => (
                    <Card
                      key={buyer.id}
                      className="p-4 cursor-pointer hover:border-border/60"
                      onClick={() => router.push(`/dashboard/buyers/${buyer.id}`)}
                    >
                      <h4 className="font-medium mb-1">{buyer.buyer_name}</h4>
                      <p className="text-sm text-muted-foreground">{buyer.contact_person}</p>
                      {buyer.pipeline_value && (
                        <p className="text-sm font-medium mt-2">${buyer.pipeline_value.toLocaleString()}</p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'table' ? (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-4 text-left text-sm font-medium">Name</th>
                <th className="p-4 text-left text-sm font-medium">Contact</th>
                <th className="p-4 text-left text-sm font-medium">Email</th>
                <th className="p-4 text-left text-sm font-medium">Stage</th>
                <th className="p-4 text-left text-sm font-medium">Value</th>
                <th className="p-4 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBuyers.map((buyer: any) => (
                <tr key={buyer.id} className="border-t">
                  <td className="p-4 font-medium">{buyer.buyer_name}</td>
                  <td className="p-4">{buyer.contact_person}</td>
                  <td className="p-4">{buyer.contact_email}</td>
                  <td className="p-4">
                    <span
                      className="px-2 py-1 rounded-full text-xs text-white"
                      style={{ backgroundColor: buyer.pipeline_stages?.[0]?.color || '#64748b' }}
                    >
                      {buyer.pipeline_stages?.[0]?.name || 'Unassigned'}
                    </span>
                  </td>
                  <td className="p-4">{buyer.pipeline_value ? `$${buyer.pipeline_value.toLocaleString()}` : '-'}</td>
                  <td className="p-4">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/buyers/${buyer.id}`)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBuyers.map((buyer: any) => (
            <Card
              key={buyer.id}
              className="p-6 cursor-pointer hover:border-border/60"
              onClick={() => router.push(`/dashboard/buyers/${buyer.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold">{buyer.buyer_name}</h3>
                <span
                  className="px-2 py-1 rounded-full text-xs text-white"
                  style={{ backgroundColor: buyer.pipeline_stages?.[0]?.color || '#64748b' }}
                >
                  {buyer.pipeline_stages?.[0]?.name || 'Unassigned'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {buyer.contact_person || 'No contact person'}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {buyer.contact_email || 'No email'}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {buyer.contact_phone || 'No phone'}
                </p>
              </div>

              {buyer.pipeline_value && (
                <p className="text-sm font-medium mb-4">${buyer.pipeline_value.toLocaleString()}</p>
              )}

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {buyer.city || buyer.country ? `${buyer.city || ''}${buyer.city && buyer.country ? ', ' : ''}${buyer.country || ''}` : 'Location unavailable'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openBuyerPortal(buyer);
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Buyer Portal
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}