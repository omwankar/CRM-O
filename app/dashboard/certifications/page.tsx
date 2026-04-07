'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Plus, Search, Edit2, Trash2, Award, Download } from 'lucide-react';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent
} from '@/components/ui/empty';

interface Certification {
  id: string;
  certification_name: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'pending';
  certificate_file?: string;
}

export default function CertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [filteredCertifications, setFilteredCertifications] = useState<Certification[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  const isAdmin = role !== 'user';

  useEffect(() => {
    fetchCertifications();
    fetchRole();
  }, []);

  useEffect(() => {
    const filtered = certifications.filter(
      (cert) =>
        cert.certification_name?.toLowerCase().includes(search.toLowerCase()) ||
        cert.issuing_authority?.toLowerCase().includes(search.toLowerCase())
    );

    setFilteredCertifications(filtered);
  }, [search, certifications]);

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

  const fetchCertifications = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCertifications(data || []);
    } catch (error) {
      console.error('Failed to fetch certifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;

    if (!confirm('Are you sure you want to delete this certification?')) return;

    try {
      const { error } = await supabase
        .from('certifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCertifications((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Failed to delete certification:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };

    return colors[status as keyof typeof colors] || colors.pending;
  };

  return (
    <div className="page-shell">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Certifications</h1>
          <p className="page-subtitle">
            {isAdmin
              ? 'Manage your certifications and licenses'
              : 'View certifications'}
          </p>
        </div>

        {/* ✅ Only Admin */}
        {isAdmin && (
          <Link href="/dashboard/certifications/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Certification
            </Button>
          </Link>
        )}
      </div>

      {/* Search */}
      <Card className="surface-card p-4">
        <div className="flex gap-2 items-center">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name or issuer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 bg-transparent"
          />
        </div>
      </Card>

      {/* Loading */}
      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="surface-card p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </Card>
          ))}
        </div>

      ) : filteredCertifications.length === 0 ? (

        /* Empty */
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Award />
            </EmptyMedia>

            <EmptyTitle>No certifications yet</EmptyTitle>

            <EmptyDescription>
              {isAdmin
                ? 'Create your first certification to get started'
                : 'No certification data available'}
            </EmptyDescription>
          </EmptyHeader>

          {/* ✅ Only Admin */}
          {isAdmin && (
            <EmptyContent>
              <Link href="/dashboard/certifications/new">
                <Button>Add Certification</Button>
              </Link>
            </EmptyContent>
          )}
        </Empty>

      ) : (

        /* List */
        <div className="grid gap-4">
          {filteredCertifications.map((cert) => (
            <Card key={cert.id} className="surface-card p-6">

              <div className="flex items-start justify-between">

                <div className="flex-1">

                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {cert.certification_name}
                    </h3>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(cert.status)}`}
                    >
                      {cert.status}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    Issuer: {cert.issuing_authority}
                  </p>

                  <div className="flex gap-6 text-sm">
                    <span className="text-muted-foreground">
                      Issued: {new Date(cert.issue_date).toLocaleDateString()}
                    </span>

                    <span className="text-muted-foreground">
                      Expires: {new Date(cert.expiry_date).toLocaleDateString()}
                    </span>
                  </div>

                </div>

                {/* Actions */}
                <div className="flex gap-2">

                  {/* ✅ Download (Everyone) */}
                  {cert.certificate_file && (
                    <a
                      href={cert.certificate_file}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4 text-blue-500" />
                      </Button>
                    </a>
                  )}

                  {/* ✅ Admin Only */}
                  {isAdmin && (
                    <>
                      <Link href={`/dashboard/certifications/${cert.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(cert.id)}
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