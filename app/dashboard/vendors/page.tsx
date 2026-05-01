'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getVendors } from '@/lib/api/vendors';
import { Plus, Search, LayoutGrid, List, ExternalLink, Mail, Phone, Building2 } from 'lucide-react';

type ViewMode = 'card' | 'table';

export default function VendorsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  const { data: vendorsData, isLoading, error } = useQuery({
    queryKey: ['vendors', search],
    queryFn: () => getVendors({ search }),
  });

  const vendors = vendorsData?.data || [];

  const filteredVendors = search
    ? vendors.filter((v: any) =>
        v.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
        v.contact_person?.toLowerCase().includes(search.toLowerCase())
      )
    : vendors;

  const openVendorPortal = (vendor: any) => {
    const rawLink = vendor?.vendor_portal_link?.trim();
    if (!rawLink) {
      router.push(`/dashboard/vendors/${vendor.id}`);
      return;
    }

    const normalizedLink = /^https?:\/\//i.test(rawLink) ? rawLink : `https://${rawLink}`;
    window.open(normalizedLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vendors</h1>
          <p className="text-muted-foreground">Manage vendor relationships</p>
        </div>
        <Button onClick={() => router.push('/dashboard/vendors/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Vendor
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex gap-2 items-center">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by vendor name or contact..."
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
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => <Card key={i} className="p-6 animate-pulse h-32" />)}
        </div>
      ) : error ? (
        <Card className="p-6">
          <p className="text-sm text-destructive">Failed to load vendors. Please refresh the page.</p>
        </Card>
      ) : filteredVendors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No vendors found</p>
        </div>
      ) : viewMode === 'table' ? (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-4 text-left text-sm font-medium">Name</th>
                <th className="p-4 text-left text-sm font-medium">Contact</th>
                <th className="p-4 text-left text-sm font-medium">Email</th>
                <th className="p-4 text-left text-sm font-medium">Category</th>
                <th className="p-4 text-left text-sm font-medium">Status</th>
                <th className="p-4 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map((vendor: any) => (
                <tr key={vendor.id} className="border-t">
                  <td className="p-4 font-medium">{vendor.vendor_name}</td>
                  <td className="p-4">{vendor.contact_person}</td>
                  <td className="p-4">{vendor.contact_email}</td>
                  <td className="p-4">{vendor.vendor_type}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${vendor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/vendors/${vendor.id}`)}>
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
          {filteredVendors.map((vendor: any) => (
            <Card
              key={vendor.id}
              className="p-6 cursor-pointer hover:border-border/60"
              onClick={() => router.push(`/dashboard/vendors/${vendor.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold">{vendor.vendor_name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${vendor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {vendor.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {vendor.contact_person || 'No contact person'}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {vendor.contact_email || 'No email'}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {vendor.contact_phone || 'No phone'}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium">{vendor.vendor_type || 'Uncategorized'}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openVendorPortal(vendor);
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Vendor Portal
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}