'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getQuotations, getQuotationStats, deleteQuotation, updateQuotation } from '@/lib/api/quotations';
import { QuotationFilters, type QuotationFiltersState } from '@/components/quotations/QuotationFilters';
import { Plus, FileText, Trash2, Pencil, Eye, LayoutGrid, Table } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { QuotationCard } from '@/components/quotations/QuotationCard';
import { EnquiryStageChangeModal } from '@/components/quotations/EnquiryStageChangeModal';
import { EnquiryStageBadge } from '@/components/quotations/EnquiryStageBadge';
import { PriorityBadge } from '@/components/quotations/PriorityBadge';
import type { Quotation, UpdateQuotationInput } from '@/types/quotations';
import { notifyQuotationError } from '@/lib/quotation-notify';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function QuotationsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { role } = useCurrentUser();

  const [filters, setFilters] = useState<QuotationFiltersState>({});
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [stageModalQuotation, setStageModalQuotation] = useState<Quotation | null>(null);

  const { data: statsData } = useQuery({
    queryKey: ['quotation-stats'],
    queryFn: getQuotationStats,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['quotations', filters, page],
    queryFn: () => getQuotations({ ...filters, page, limit: 20 }),
  });

  const mutation = useMutation({
    mutationFn: (id: string) => deleteQuotation(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['quotations'] });
      await qc.invalidateQueries({ queryKey: ['quotation-stats'] });
      await qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setDeleteId(null);
    },
    onError: (error) => notifyQuotationError(error, 'Could not delete this enquiry.'),
  });

  const enquiryStageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuotationInput }) => updateQuotation(id, data),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: ['quotations'] });
      await qc.invalidateQueries({ queryKey: ['quotation-stats'] });
      await qc.invalidateQueries({ queryKey: ['quotation', vars.id] });
    },
  });

  const rows = data?.data || [];
  const totalPages = data?.totalPages || 0;

  const stats = useMemo(() => {
    const total = statsData?.total || 0;
    const by = (statsData?.by_status || {}) as Record<string, number>;
    return {
      total,
      waiting: by.waiting_from_companies || 0,
      needRevision: by.need_revision || 0,
      approved: by.approved || 0,
    };
  }, [statsData]);

  const canDelete = role === 'super_admin';
  const canChangeEnquiryStage = role === 'super_admin' || role === 'admin';

  const deadlineTone = (deadline?: string | null) => {
    if (!deadline) return 'text-muted-foreground';
    const d = new Date(deadline);
    if (Number.isNaN(d.getTime())) return 'text-muted-foreground';
    const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'text-red-500';
    if (days <= 7) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quotation tracker</h1>
          <p className="text-muted-foreground">Track enquiries, vendor quotes, follow-ups, and outcomes</p>
        </div>
        <Button onClick={() => router.push('/dashboard/quotations/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New enquiry
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Waiting', value: stats.waiting },
          { label: 'Need Revision', value: stats.needRevision },
          { label: 'Approved', value: stats.approved },
        ].map((s) => (
          <Card key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border border-border bg-card p-4">
        <QuotationFilters
          filters={filters}
          onChange={(next) => {
            setPage(1);
            setFilters(next);
          }}
        />
      </Card>

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 border-b border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6">
          <p className="text-sm text-destructive">Failed to load quotations. Please refresh.</p>
          <p className="text-xs text-muted-foreground mt-2 break-all">
            {String((error as any)?.message || '')}
          </p>
        </Card>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No quotations found</p>
          <Button className="mt-4" onClick={() => router.push('/dashboard/quotations/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Create your first quotation
          </Button>
        </div>
      ) : (
        <>
          {/* View Toggle (match Projects/Tasks) */}
          <div className="flex justify-end">
            <div className="flex items-center gap-1 border border-border rounded-lg p-1">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="h-8"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8"
              >
                <Table className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rows.map((q: any) => (
                <QuotationCard
                  key={q.id}
                  quotation={q}
                  canChangeEnquiryStage={canChangeEnquiryStage}
                  onChangeEnquiryStage={(qt) => setStageModalQuotation(qt)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">QT Number</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Requirement</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Stage</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Priority</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Lead</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Project</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Deadline</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Vendors</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((q: any) => (
                    <tr
                      key={q.id}
                      className="border-t border-border hover:bg-muted/40 cursor-pointer"
                      onClick={() => router.push(`/dashboard/quotations/${q.id}`)}
                    >
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{q.quotation_number}</td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {(q.requirement || '').length > 40 ? `${q.requirement.slice(0, 40)}…` : q.requirement}
                      </td>
                      <td className="px-4 py-3">
                        <EnquiryStageBadge quotation={q} />
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={q.priority} />
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{q.users?.full_name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {q.projects?.project_name || q.standalone_project_name || '—'}
                      </td>
                      <td className={`px-4 py-3 text-sm ${deadlineTone(q.deadline)}`}>
                        {q.deadline ? new Date(q.deadline).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium tabular-nums">
                        {typeof q.vendor_quotes_count === 'number'
                          ? q.vendor_quotes_count
                          : (q.quotation_vendor_quotes || []).length}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/quotations/${q.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/quotations/${q.id}/edit`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <Button variant="ghost" size="sm" onClick={() => setDeleteId(q.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {deleteId && (
        <AlertDialog open onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete quotation?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Only super admins can delete quotations.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => deleteId && mutation.mutate(deleteId)}
                disabled={mutation.isPending}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {stageModalQuotation && (
        <EnquiryStageChangeModal
          isOpen={!!stageModalQuotation}
          quotation={stageModalQuotation}
          onClose={() => setStageModalQuotation(null)}
          onConfirm={async (patch) => {
            await enquiryStageMutation.mutateAsync({ id: stageModalQuotation.id, data: patch });
          }}
        />
      )}
    </div>
  );
}

