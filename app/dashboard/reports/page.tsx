'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Download, Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  getQuotationReport,
  getLeaveReport,
  getTimelogReport,
  getCompanyMonthlyReport,
} from '@/lib/api/reports';

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

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function yearStart() {
  return `${new Date().getFullYear()}-01-01`;
}

function QuotationsTab() {
  const [from, setFrom] = useState(yearStart());
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const { data, isLoading } = useQuery({
    queryKey: ['report-quotations', from, to],
    queryFn: () => getQuotationReport({ from, to }),
  });

  if (isLoading || !data) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const stageData = Object.entries(data.by_stage).map(([stage, count]) => ({ name: stage.replace(/_/g, ' '), count }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-medium block mb-1">From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadCsv('quotations-report.csv', [
              { metric: 'Total received', value: data.total },
              { metric: 'Won', value: data.won },
              { metric: 'Lost', value: data.lost },
              { metric: 'Cancelled', value: data.cancelled },
              { metric: 'Overdue', value: data.overdue },
            ])
          }
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Received', value: data.total },
          { label: 'Won', value: data.won },
          { label: 'Lost', value: data.lost },
          { label: 'Cancelled', value: data.cancelled },
          { label: 'Overdue', value: data.overdue },
        ].map((c) => (
          <Card key={c.label} className="p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-bold">{c.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-4">By enquiry stage</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stageData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {data.monthly_trend.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Monthly trend (received)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly_trend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}

function LeaveTab() {
  const [from, setFrom] = useState(yearStart());
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const { data, isLoading } = useQuery({
    queryKey: ['report-leave', from, to],
    queryFn: () => getLeaveReport({ from, to }),
  });

  if (isLoading || !data) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-medium block mb-1">From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadCsv('leave-report.csv', data.days_by_employee.map((d) => ({ employee: d.name, approved_days: d.days })))}
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold">{data.by_status.pending || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Approved</p>
          <p className="text-2xl font-bold">{data.by_status.approved || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Rejected</p>
          <p className="text-2xl font-bold">{data.by_status.rejected || 0}</p>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">Approved leave days by employee</h3>
        {data.days_by_employee.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No approved leave in range.</p>
        ) : (
          <div className="divide-y divide-border">
            {data.days_by_employee.map((d) => (
              <div key={d.user_id} className="flex justify-between py-2 text-sm">
                <span>{d.name}</span>
                <span className="font-medium">{d.days} days</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function TimelogTab() {
  const [month, setMonth] = useState(currentMonth());
  const { data, isLoading } = useQuery({
    queryKey: ['report-timelog', month],
    queryFn: () => getTimelogReport(month),
  });

  if (isLoading || !data) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-medium block mb-1">Month</label>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto" />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadCsv(
              'timelog-report.csv',
              data.rows.map((r) => ({
                employee: r.name,
                clocked_hours: r.clocked_hours,
                logged_hours: r.logged_hours,
                idle_hours: r.idle_hours,
                utilization_pct: r.utilization,
              })),
            )
          }
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">{data.manager_view ? 'Team utilization' : 'My utilization'}</h3>
        {data.rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No data for this month.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 font-medium">Employee</th>
                  <th className="py-2 font-medium text-right">Clocked</th>
                  <th className="py-2 font-medium text-right">Logged</th>
                  <th className="py-2 font-medium text-right">Idle</th>
                  <th className="py-2 font-medium text-right">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.user_id} className="border-b border-border last:border-0">
                    <td className="py-2">{r.name}</td>
                    <td className="py-2 text-right">{r.clocked_hours}h</td>
                    <td className="py-2 text-right">{r.logged_hours}h</td>
                    <td className="py-2 text-right text-amber-600">{r.idle_hours}h</td>
                    <td className="py-2 text-right font-medium">{r.utilization}%</td>
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

function MonthlyTab() {
  const [month, setMonth] = useState(currentMonth());
  const { data, isLoading } = useQuery({
    queryKey: ['report-monthly', month],
    queryFn: () => getCompanyMonthlyReport(month),
  });

  if (isLoading || !data) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const cards = [
    { label: 'Active headcount', value: data.headcount_active },
    { label: 'Quotations received', value: data.quotations.received },
    { label: 'Quotations won', value: data.quotations.won },
    { label: 'Quotations lost', value: data.quotations.lost },
    { label: 'Total clock hours', value: data.total_clock_hours },
    { label: 'Leave requests', value: data.leave_requests },
    { label: 'Approved leaves', value: data.approved_leaves },
    { label: 'Holidays', value: data.holidays },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-medium block mb-1">Month</label>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto" />
        </div>
        <Button variant="outline" size="sm" onClick={() => downloadCsv('monthly-report.csv', cards.map((c) => ({ metric: c.label, value: c.value })))}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-bold">{c.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { canWrite, isLoading } = useCurrentUser();

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          Reports
        </h1>
        <p className="text-muted-foreground">Analysis of quotations, attendance, leave and time utilization.</p>
      </div>

      <Tabs defaultValue={canWrite ? 'quotations' : 'timelog'}>
        <TabsList>
          {canWrite && <TabsTrigger value="quotations">Quotations</TabsTrigger>}
          {canWrite && <TabsTrigger value="leave">Leave</TabsTrigger>}
          <TabsTrigger value="timelog">Time log</TabsTrigger>
          {canWrite && <TabsTrigger value="monthly">Monthly</TabsTrigger>}
        </TabsList>

        {canWrite && (
          <TabsContent value="quotations" className="mt-4">
            <QuotationsTab />
          </TabsContent>
        )}
        {canWrite && (
          <TabsContent value="leave" className="mt-4">
            <LeaveTab />
          </TabsContent>
        )}
        <TabsContent value="timelog" className="mt-4">
          <TimelogTab />
        </TabsContent>
        {canWrite && (
          <TabsContent value="monthly" className="mt-4">
            <MonthlyTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
