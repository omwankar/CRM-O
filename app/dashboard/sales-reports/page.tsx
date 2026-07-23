'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Download, Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  getSalesForecastReport,
  getSalesFunnelReport,
  getSalesPipelineReport,
  getSalesQuotationWinRateReport,
  getSalesRepPerformanceReport,
  getSalesStaleReport,
} from '@/lib/api/reports';
import { OPPORTUNITY_STAGE_LABELS } from '@/types/opportunities';

const FUNNEL_COLORS = ['#2563eb', '#7c3aed', '#0d9488', '#059669'];
const SOURCE_OPTIONS = [
  { value: 'all', label: 'All sources' },
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'cold_call', label: 'Cold call' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
];

function yearStart() {
  return `${new Date().getFullYear()}-01-01`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function fmtMoney(n: number | null | undefined) {
  if (n == null) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function fmtPct(n: number | null | undefined) {
  if (n == null) return '—';
  return `${n}%`;
}

function Loading() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function PipelineTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['sales-report-pipeline'],
    queryFn: getSalesPipelineReport,
  });

  if (isLoading || !data) return <Loading />;

  const chartData = data.stages.map((s) => ({
    name: OPPORTUNITY_STAGE_LABELS[s.stage as keyof typeof OPPORTUNITY_STAGE_LABELS] || s.stage,
    count: s.count,
    value: s.total_value,
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadCsv(
              'pipeline-report.csv',
              data.stages.map((s) => ({
                stage: s.stage,
                count: s.count,
                total_value: s.total_value,
              })),
            )
          }
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Open deals', value: data.summary.open_count },
          { label: 'Open value', value: fmtMoney(data.summary.open_value) },
          { label: 'Won deals', value: data.summary.won_count },
          { label: 'Won value', value: fmtMoney(data.summary.won_value) },
        ].map((c) => (
          <Card key={c.label} className="p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-bold tabular-nums">{c.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Deals by stage</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Value by stage</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmtMoney(v)} />
                <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function FunnelTab() {
  const [from, setFrom] = useState(yearStart());
  const [to, setTo] = useState(today());
  const [source, setSource] = useState('all');
  const { data, isLoading } = useQuery({
    queryKey: ['sales-report-funnel', from, to, source],
    queryFn: () => getSalesFunnelReport({ from, to, source }),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <DateFilters from={from} to={to} setFrom={setFrom} setTo={setTo} />
        <Loading />
      </div>
    );
  }

  const funnelData = data.steps.map((s, i) => ({
    name: s.label,
    value: s.count,
    fill: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <DateFilters from={from} to={to} setFrom={setFrom} setTo={setTo} />
        <div>
          <label className="text-xs font-medium block mb-1">Source</label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {data.steps.map((s) => (
          <Card key={s.key} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold tabular-nums">{s.count}</p>
            {s.conversion_from_prev_pct != null ? (
              <p className="text-xs text-muted-foreground mt-1">{fmtPct(s.conversion_from_prev_pct)} from prior</p>
            ) : null}
          </Card>
        ))}
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Lead → Won</p>
          <p className="text-2xl font-bold tabular-nums">{fmtPct(data.overall_lead_to_won_pct)}</p>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-4">Conversion funnel</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip />
              <Funnel dataKey="value" data={funnelData} isAnimationActive>
                <LabelList position="right" fill="currentColor" stroke="none" dataKey="name" />
                {funnelData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {data.by_source.length > 0 ? (
        <Card className="p-5">
          <h3 className="font-semibold mb-3">By lead source</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 font-medium">Source</th>
                  <th className="py-2 font-medium text-right">Leads</th>
                  <th className="py-2 font-medium text-right">Opps</th>
                  <th className="py-2 font-medium text-right">Quotes</th>
                  <th className="py-2 font-medium text-right">Won</th>
                  <th className="py-2 font-medium text-right">L→O</th>
                  <th className="py-2 font-medium text-right">O→Q</th>
                  <th className="py-2 font-medium text-right">Q→W</th>
                </tr>
              </thead>
              <tbody>
                {data.by_source.map((r) => (
                  <tr key={r.source} className="border-b border-border last:border-0">
                    <td className="py-2 capitalize">{r.source.replace(/_/g, ' ')}</td>
                    <td className="py-2 text-right tabular-nums">{r.leads}</td>
                    <td className="py-2 text-right tabular-nums">{r.opportunities}</td>
                    <td className="py-2 text-right tabular-nums">{r.quotations}</td>
                    <td className="py-2 text-right tabular-nums">{r.won}</td>
                    <td className="py-2 text-right tabular-nums">{fmtPct(r.lead_to_opp_pct)}</td>
                    <td className="py-2 text-right tabular-nums">{fmtPct(r.opp_to_quote_pct)}</td>
                    <td className="py-2 text-right tabular-nums">{fmtPct(r.quote_to_won_pct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function RepPerformanceTab() {
  const [from, setFrom] = useState(yearStart());
  const [to, setTo] = useState(today());
  const { data, isLoading } = useQuery({
    queryKey: ['sales-report-reps', from, to],
    queryFn: () => getSalesRepPerformanceReport({ from, to }),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <DateFilters from={from} to={to} setFrom={setFrom} setTo={setTo} />
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <DateFilters from={from} to={to} setFrom={setFrom} setTo={setTo} />
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadCsv(
              'rep-performance.csv',
              data.reps.map((r) => ({
                name: r.name,
                won: r.won,
                lost: r.lost,
                open: r.open,
                won_value: r.won_value,
                avg_deal_size: r.avg_deal_size ?? '',
                avg_days_to_close: r.avg_days_to_close ?? '',
                activity_count: r.activity_count,
              })),
            )
          }
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {data.manager_view
          ? 'Team comparison — won/lost, deal size, time-to-close, and activity volume.'
          : 'Your performance only. Managers see the full team comparison.'}
      </p>

      <Card className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 font-medium">Rep</th>
                <th className="py-2 font-medium text-right">Won</th>
                <th className="py-2 font-medium text-right">Lost</th>
                <th className="py-2 font-medium text-right">Open</th>
                <th className="py-2 font-medium text-right">Won value</th>
                <th className="py-2 font-medium text-right">Avg deal</th>
                <th className="py-2 font-medium text-right">Avg days to close</th>
                <th className="py-2 font-medium text-right">Activities</th>
              </tr>
            </thead>
            <tbody>
              {data.reps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-muted-foreground">
                    No opportunity data in this range.
                  </td>
                </tr>
              ) : (
                data.reps.map((r) => (
                  <tr key={r.owner_id} className="border-b border-border last:border-0">
                    <td className="py-2 font-medium">{r.name}</td>
                    <td className="py-2 text-right tabular-nums text-emerald-700 dark:text-emerald-400">{r.won}</td>
                    <td className="py-2 text-right tabular-nums text-red-700 dark:text-red-400">{r.lost}</td>
                    <td className="py-2 text-right tabular-nums">{r.open}</td>
                    <td className="py-2 text-right tabular-nums">{fmtMoney(r.won_value)}</td>
                    <td className="py-2 text-right tabular-nums">{fmtMoney(r.avg_deal_size)}</td>
                    <td className="py-2 text-right tabular-nums">
                      {r.avg_days_to_close != null ? Math.round(r.avg_days_to_close) : '—'}
                    </td>
                    <td className="py-2 text-right tabular-nums">{r.activity_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StaleTab() {
  const [days, setDays] = useState(14);
  const { data, isLoading } = useQuery({
    queryKey: ['sales-report-stale', days],
    queryFn: () => getSalesStaleReport(days),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-medium block mb-1">Stale after (days)</label>
          <Input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 14))}
            className="w-28"
          />
        </div>
      </div>

      {isLoading || !data ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Stale opportunities</p>
              <p className="text-2xl font-bold tabular-nums">{data.summary.stale_opportunities}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Stale enquiries</p>
              <p className="text-2xl font-bold tabular-nums">{data.summary.stale_enquiries}</p>
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Opportunities</h3>
            {data.opportunities.length === 0 ? (
              <p className="text-sm text-muted-foreground">None stale at this threshold.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="py-2 font-medium">Deal</th>
                      <th className="py-2 font-medium">Owner</th>
                      <th className="py-2 font-medium text-right">Days idle</th>
                      <th className="py-2 font-medium text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.opportunities.map((o) => (
                      <tr key={o.id} className="border-b border-border last:border-0">
                        <td className="py-2">
                          <Link href={`/dashboard/opportunities/${o.id}`} className="text-blue-600 hover:underline">
                            {o.title}
                          </Link>
                          <span className="text-xs text-muted-foreground ml-2">{o.stage.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="py-2">{o.owner_name || '—'}</td>
                        <td className="py-2 text-right tabular-nums text-amber-700 dark:text-amber-400">
                          {o.days_since_last_activity ?? 'Never'}
                        </td>
                        <td className="py-2 text-right tabular-nums">{fmtMoney(o.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Enquiries</h3>
            {data.enquiries.length === 0 ? (
              <p className="text-sm text-muted-foreground">None stale at this threshold.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="py-2 font-medium">Enquiry</th>
                      <th className="py-2 font-medium">Owner</th>
                      <th className="py-2 font-medium text-right">Days idle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.enquiries.map((e) => (
                      <tr key={e.id} className="border-b border-border last:border-0">
                        <td className="py-2">
                          <Link href={`/dashboard/enquiries/${e.id}`} className="text-blue-600 hover:underline">
                            {e.enquiry_number || e.title || e.id.slice(0, 8)}
                          </Link>
                          <span className="text-xs text-muted-foreground ml-2">{e.stage.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="py-2">{e.owner_name || '—'}</td>
                        <td className="py-2 text-right tabular-nums text-amber-700 dark:text-amber-400">
                          {e.days_since_last_activity ?? 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function QuotationWinTab() {
  const [from, setFrom] = useState(yearStart());
  const [to, setTo] = useState(today());
  const { data, isLoading } = useQuery({
    queryKey: ['sales-report-quote-win', from, to],
    queryFn: () => getSalesQuotationWinRateReport({ from, to }),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <DateFilters from={from} to={to} setFrom={setFrom} setTo={setTo} />
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DateFilters from={from} to={to} setFrom={setFrom} setTo={setTo} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: data.total },
          { label: 'Sent', value: data.sent },
          { label: 'Won', value: data.won },
          { label: 'Lost', value: data.lost },
          { label: 'Win rate', value: fmtPct(data.win_rate_pct) },
          { label: 'Loss rate', value: fmtPct(data.loss_rate_pct) },
          { label: 'Avg revisions to close', value: data.avg_revisions_before_close ?? '—' },
          { label: 'Cancelled', value: data.cancelled },
        ].map((c) => (
          <Card key={c.label} className="p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-bold tabular-nums">{c.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ForecastTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['sales-report-forecast'],
    queryFn: getSalesForecastReport,
  });

  if (isLoading || !data) return <Loading />;

  const chartData = data.by_month.map((m) => ({
    name: m.month === 'unscheduled' ? 'No date' : m.month,
    pipeline: m.pipeline_value,
    weighted: m.weighted_value,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Open deals</p>
          <p className="text-2xl font-bold tabular-nums">{data.summary.open_deals}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Pipeline value</p>
          <p className="text-2xl font-bold tabular-nums">{fmtMoney(data.summary.pipeline_value)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Weighted forecast</p>
          <p className="text-2xl font-bold tabular-nums">{fmtMoney(data.summary.weighted_forecast)}</p>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-1">Forecast by expected close month</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Weights: Lead 10% · Contacted 25% · Proposal 50% · Negotiating 70%
        </p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => fmtMoney(v)} />
              <Bar dataKey="pipeline" name="Pipeline" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="weighted" name="Weighted" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function DateFilters({
  from,
  to,
  setFrom,
  setTo,
}: {
  from: string;
  to: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="text-xs font-medium block mb-1">From</label>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
      </div>
      <div>
        <label className="text-xs font-medium block mb-1">To</label>
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
      </div>
    </div>
  );
}

export default function SalesReportsPage() {
  const { canWrite, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-teal-600" />
          Sales reports
        </h1>
        <p className="text-muted-foreground">
          Pipeline, funnel, performance, and forecast on Opportunity → Enquiry → Quotation.
        </p>
      </div>

      <Tabs defaultValue={canWrite ? 'pipeline' : 'performance'}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {canWrite && <TabsTrigger value="pipeline">Pipeline</TabsTrigger>}
          {canWrite && <TabsTrigger value="funnel">Funnel</TabsTrigger>}
          <TabsTrigger value="performance">{canWrite ? 'Rep performance' : 'My performance'}</TabsTrigger>
          {canWrite && <TabsTrigger value="stale">Stale pipeline</TabsTrigger>}
          {canWrite && <TabsTrigger value="winrate">Quote win rate</TabsTrigger>}
          {canWrite && <TabsTrigger value="forecast">Forecast</TabsTrigger>}
        </TabsList>

        {canWrite && (
          <TabsContent value="pipeline" className="mt-4">
            <PipelineTab />
          </TabsContent>
        )}
        {canWrite && (
          <TabsContent value="funnel" className="mt-4">
            <FunnelTab />
          </TabsContent>
        )}
        <TabsContent value="performance" className="mt-4">
          <RepPerformanceTab />
        </TabsContent>
        {canWrite && (
          <TabsContent value="stale" className="mt-4">
            <StaleTab />
          </TabsContent>
        )}
        {canWrite && (
          <TabsContent value="winrate" className="mt-4">
            <QuotationWinTab />
          </TabsContent>
        )}
        {canWrite && (
          <TabsContent value="forecast" className="mt-4">
            <ForecastTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
