'use client';

import { useMemo, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Search, FileSearch, ArrowRightCircle, Trash2 } from 'lucide-react';
import {
  convertEnquiryToQuotation,
  deleteEnquiry,
  getEnquiries,
  getEnquiryStats,
} from '@/lib/api/enquiries';
import {
  ENQUIRY_STAGE_BADGE_CLASSES,
  ENQUIRY_STAGE_LABELS,
  ENQUIRY_STAGES_ORDER,
  type EnquiryStage,
} from '@/types/enquiries';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function EnquiriesPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { role, user } = useCurrentUser();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [stageFilter, setStageFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['enquiries', stageFilter, debouncedSearch],
    queryFn: () =>
      getEnquiries({
        stage: stageFilter,
        search: debouncedSearch || undefined,
        limit: 100,
      }),
  });

  const { data: stats } = useQuery({
    queryKey: ['enquiry-stats'],
    queryFn: getEnquiryStats,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['enquiries'] });
    qc.invalidateQueries({ queryKey: ['enquiry-stats'] });
  };

  const convertMut = useMutation({
    mutationFn: (id: string) => convertEnquiryToQuotation(id),
    onSuccess: (result) => {
      toast.success(`Quotation ${result.quotation.quotation_number} created`);
      if (result.credit_warning?.message) {
        toast.warning(result.credit_warning.message, { duration: 8000 });
      }
      invalidate();
      router.push(`/dashboard/quotations/${result.quotation.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteEnquiry(id),
    onSuccess: () => {
      toast.success('Enquiry deleted');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = data?.data || [];
  const canDelete = (createdBy: string | null) =>
    role === 'manager' || role === 'super_admin' || createdBy === user?.id;

  const stageChips = useMemo(() => {
    const by = stats?.by_stage || {};
    return ENQUIRY_STAGES_ORDER.map((s) => ({
      stage: s,
      count: by[s] || 0,
    }));
  }, [stats]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enquiries</h1>
          <p className="text-muted-foreground mt-1">
            Capture customer requirements before vendor pricing or a committed quote.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/enquiries/new">
            <Plus className="w-4 h-4 mr-2" />
            New enquiry
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-semibold">{stats?.total ?? '—'}</p>
        </Card>
        {stageChips.slice(0, 6).map((c) => (
          <Card key={c.stage} className="p-3">
            <p className="text-xs text-muted-foreground truncate">{ENQUIRY_STAGE_LABELS[c.stage]}</p>
            <p className="text-2xl font-semibold">{c.count}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search number, title, requirement…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {ENQUIRY_STAGES_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {ENQUIRY_STAGE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading enquiries…</p>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <FileSearch className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="font-medium">No enquiries yet</p>
            <p className="text-sm text-muted-foreground">
              Create an enquiry when a customer request comes in — before you have pricing.
            </p>
            <Button asChild className="mt-2">
              <Link href="/dashboard/enquiries/new">New enquiry</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Enquiry</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Deadline</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/enquiries/${row.id}`}
                        className="font-mono text-xs text-blue-600 hover:underline"
                      >
                        {row.enquiry_number}
                      </Link>
                      <p className="font-medium mt-0.5 line-clamp-1">
                        {row.title || row.requirement.slice(0, 60)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="line-clamp-1">
                        {row.buyer?.buyer_name ||
                          row.prospect_name ||
                          row.standalone_project_name ||
                          '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">{row.client_email || ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={ENQUIRY_STAGE_BADGE_CLASSES[row.stage as EnquiryStage]}
                      >
                        {ENQUIRY_STAGE_LABELS[row.stage as EnquiryStage] || row.stage}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 capitalize">{row.priority}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.deadline ? new Date(row.deadline).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={convertMut.isPending}
                          onClick={() => convertMut.mutate(row.id)}
                          title="Create quotation"
                        >
                          <ArrowRightCircle className="w-4 h-4 mr-1" />
                          Quote
                        </Button>
                        {canDelete(row.created_by) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => {
                              if (confirm(`Delete ${row.enquiry_number}?`)) deleteMut.mutate(row.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
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
      </Card>
    </div>
  );
}
