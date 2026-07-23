'use client';

import { useMemo, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Search, Kanban, List, Briefcase } from 'lucide-react';
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
import {
  getOpportunities,
  getOpportunityStats,
  updateOpportunity,
} from '@/lib/api/opportunities';
import { DaysSinceBadge } from '@/components/activities/ActivityTimeline';
import {
  OPPORTUNITY_STAGE_BADGE,
  OPPORTUNITY_STAGE_LABELS,
  OPPORTUNITY_STAGES_ORDER,
  type OpportunityStage,
} from '@/types/opportunities';

type ViewMode = 'list' | 'kanban';

export default function OpportunitiesPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [stageFilter, setStageFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [sortCold, setSortCold] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['opportunities', stageFilter, debouncedSearch],
    queryFn: () =>
      getOpportunities({
        stage: stageFilter,
        search: debouncedSearch || undefined,
        limit: 50,
      }),
  });

  const { data: stats } = useQuery({
    queryKey: ['opportunity-stats'],
    queryFn: getOpportunityStats,
  });

  const stageMut = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: OpportunityStage }) =>
      updateOpportunity(id, { stage }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      qc.invalidateQueries({ queryKey: ['opportunity-stats'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const list = data?.data || [];
    if (!sortCold) return list;
    return [...list].sort((a, b) => {
      const da = a.days_since_last_activity == null ? 9999 : a.days_since_last_activity;
      const db = b.days_since_last_activity == null ? 9999 : b.days_since_last_activity;
      return db - da;
    });
  }, [data?.data, sortCold]);

  const byStage = useMemo(() => {
    const map: Record<string, typeof rows> = {};
    for (const s of OPPORTUNITY_STAGES_ORDER) map[s] = [];
    for (const row of rows) {
      const s = row.stage as OpportunityStage;
      if (!map[s]) map[s] = [];
      map[s].push(row);
    }
    return map;
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Opportunities</h1>
          <p className="text-muted-foreground mt-1">
            Deal-level pipeline — one buyer can have many open opportunities.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/opportunities/new">
            <Plus className="w-4 h-4 mr-2" />
            New opportunity
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total open deals</p>
          <p className="text-2xl font-semibold">
            {(stats?.by_stage?.lead || 0) +
              (stats?.by_stage?.contacted || 0) +
              (stats?.by_stage?.proposal_sent || 0) +
              (stats?.by_stage?.negotiating || 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Open pipeline value</p>
          <p className="text-2xl font-semibold tabular-nums">
            {(stats?.open_pipeline_value || 0).toLocaleString()}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Won</p>
          <p className="text-2xl font-semibold">{stats?.by_stage?.closed_won || 0}</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search opportunities…"
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
            {OPPORTUNITY_STAGES_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {OPPORTUNITY_STAGE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex border rounded-lg overflow-hidden">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none"
            onClick={() => setViewMode('kanban')}
          >
            <Kanban className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant={sortCold ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortCold((v) => !v)}
        >
          Coldest first
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading opportunities…</p>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center space-y-2">
          <Briefcase className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="font-medium">No opportunities yet</p>
          <p className="text-sm text-muted-foreground">
            Convert a lead, or create an opportunity on an existing buyer.
          </p>
        </Card>
      ) : viewMode === 'kanban' ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {OPPORTUNITY_STAGES_ORDER.map((stage) => (
            <div key={stage} className="w-72 shrink-0 rounded-xl border bg-muted/20 p-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">{OPPORTUNITY_STAGE_LABELS[stage]}</p>
                <span className="text-xs text-muted-foreground">{byStage[stage]?.length || 0}</span>
              </div>
              <div className="space-y-2 min-h-[120px]">
                {(byStage[stage] || []).map((opp) => (
                  <Card
                    key={opp.id}
                    className="p-3 cursor-pointer hover:shadow-sm"
                    onClick={() => router.push(`/dashboard/opportunities/${opp.id}`)}
                  >
                    <p className="font-medium text-sm line-clamp-2">{opp.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {opp.buyer?.buyer_name || '—'}
                    </p>
                    {opp.value != null ? (
                      <p className="text-xs font-medium mt-1 tabular-nums">
                        {opp.currency || ''} {Number(opp.value).toLocaleString()}
                      </p>
                    ) : null}
                    <div className="mt-2">
                      <DaysSinceBadge
                        days={opp.days_since_last_activity}
                        lastAt={opp.last_activity_at}
                      />
                    </div>
                    <Select
                      value={opp.stage}
                      onValueChange={(v) => {
                        stageMut.mutate({ id: opp.id, stage: v as OpportunityStage });
                      }}
                    >
                      <SelectTrigger
                        className="mt-2 h-8 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPPORTUNITY_STAGES_ORDER.map((s) => (
                          <SelectItem key={s} value={s}>
                            {OPPORTUNITY_STAGE_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Opportunity</th>
                <th className="px-4 py-3 font-medium">Buyer</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Last activity</th>
                <th className="px-4 py-3 font-medium">Close</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((opp) => (
                <tr
                  key={opp.id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={() => router.push(`/dashboard/opportunities/${opp.id}`)}
                >
                  <td className="px-4 py-3 font-medium">{opp.title}</td>
                  <td className="px-4 py-3">{opp.buyer?.buyer_name || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={OPPORTUNITY_STAGE_BADGE[opp.stage]}>
                      {OPPORTUNITY_STAGE_LABELS[opp.stage]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {opp.value != null ? `${opp.currency || ''} ${Number(opp.value).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <DaysSinceBadge
                      days={opp.days_since_last_activity}
                      lastAt={opp.last_activity_at}
                    />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {opp.expected_close_date
                      ? new Date(opp.expected_close_date).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
