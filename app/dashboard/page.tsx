'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getDashboardStats } from '@/lib/api/dashboard';
import { getPunchStats } from '@/lib/api/clock';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  CheckSquare,
  Contact2,
  FileSearch,
  Filter,
  Inbox,
  PieChart,
  Plus,
  Target,
  TrendingUp,
} from 'lucide-react';
import { AnnouncementsWidget } from '@/components/announcements/AnnouncementsWidget';
import { HomeCalendar } from '@/components/dashboard/HomeCalendar';
import { useIsClient } from '@/hooks/useIsClient';
import { formatUkDate } from '@/lib/date';
import { ENQUIRY_STAGE_LABELS, ENQUIRY_STAGES_ORDER, type EnquiryStage } from '@/types/enquiries';

function taskStatusStyle(status?: string) {
  const s = String(status || '').toLowerCase().replace(/\s+/g, '_');
  if (s === 'in_progress' || s === 'inprogress') return 'bg-sky-100 text-sky-800';
  if (s === 'completed' || s === 'closed') return 'bg-emerald-100 text-emerald-800';
  return 'bg-rose-100 text-rose-700';
}

function taskStatusLabel(status?: string) {
  const s = String(status || '').toLowerCase().replace(/\s+/g, '_');
  if (s === 'in_progress' || s === 'inprogress') return 'In Progress';
  if (s === 'completed' || s === 'closed') return 'Completed';
  if (s === 'pending' || s === 'to_do' || s === 'todo') return 'To Do';
  return status || 'To Do';
}

function friendlyAction(action?: string, tableName?: string) {
  const raw = String(action || '').toLowerCase();
  const table = String(tableName || '').replace(/_/g, ' ');
  if (raw.startsWith('post_')) return `created a ${table || raw.slice(5)} record`;
  if (raw.startsWith('put_') || raw.startsWith('patch_')) return `updated a ${table || 'record'}`;
  if (raw.startsWith('delete_')) return `removed a ${table || 'record'}`;
  return action || 'made a change';
}

function relativeTime(iso?: string) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diffMs)) return '';
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffHr < 48) return 'Yesterday';
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function initials(name?: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const ENQUIRY_STAGE_META: Record<EnquiryStage, { label: string; bar: string; badge: string }> = {
  new_enquiry: { label: ENQUIRY_STAGE_LABELS.new_enquiry, bar: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' },
  under_review: { label: ENQUIRY_STAGE_LABELS.under_review, bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800' },
  preparing: { label: ENQUIRY_STAGE_LABELS.preparing, bar: 'bg-violet-500', badge: 'bg-violet-100 text-violet-800' },
  quote_sent: { label: ENQUIRY_STAGE_LABELS.quote_sent, bar: 'bg-sky-500', badge: 'bg-sky-100 text-sky-800' },
  follow_up: { label: ENQUIRY_STAGE_LABELS.follow_up, bar: 'bg-slate-500', badge: 'bg-slate-100 text-slate-700' },
  won_closed: { label: ENQUIRY_STAGE_LABELS.won_closed, bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800' },
  lost_closed: { label: ENQUIRY_STAGE_LABELS.lost_closed, bar: 'bg-rose-400', badge: 'bg-rose-100 text-rose-700' },
};

const PRIORITY_LABELS: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const DONUT_COLORS = ['#2563EB', '#14B8A6', '#8B5CF6', '#F59E0B', '#F43F5E', '#64748B'];

/** Simple SVG donut chart. */
function Donut({ segments, total, centerLabel }: { segments: Array<{ value: number; color: string }>; total: number; centerLabel: string }) {
  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg viewBox="0 0 120 120" className="h-40 w-40">
      <circle cx="60" cy="60" r={R} fill="none" stroke="#EEF2FF" strokeWidth="16" />
      {total > 0 &&
        segments.map((s, i) => {
          const frac = s.value / total;
          const dash = frac * C;
          const el = (
            <circle
              key={i}
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return el;
        })}
      <text x="60" y="57" textAnchor="middle" className="fill-slate-800" fontSize="18" fontWeight="700">
        {total}
      </text>
      <text x="60" y="72" textAnchor="middle" className="fill-slate-500" fontSize="8">
        {centerLabel}
      </text>
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const isClient = useIsClient();
  const { role, profile, user, isSuperAdmin, inOperations } = useCurrentUser();
  const [mountedName, setMountedName] = useState('');

  useEffect(() => {
    const name =
      profile?.full_name?.trim() ||
      user?.user_metadata?.full_name ||
      profile?.email?.split('@')[0] ||
      user?.email?.split('@')[0] ||
      '';
    setMountedName(name);
  }, [profile, user]);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    staleTime: 60 * 1000,
  });

  const { data: punchStats } = useQuery({
    queryKey: ['punchStats'],
    queryFn: getPunchStats,
    enabled: role === 'super_admin',
  });

  const crm = (dashboardData as any)?.crm || {
    enquiries: { total: 0, change: 0 },
    contacts: { total: 0, change: 0 },
    companies: { total: 0, change: 0 },
    opportunities: { total: 0, change: 0 },
    enquiriesByStage: {},
    enquiriesByPriority: {},
    recentEnquiries: [],
  };

  const recentActivity = dashboardData?.recentActivity || [];
  const myTasks = dashboardData?.myTasks || [];
  const onLeaveToday = dashboardData?.onLeaveToday || [];
  const displayName = isClient ? mountedName || 'there' : 'there';

  const statCards = [
    {
      label: 'Total Enquiries',
      value: crm.enquiries?.total ?? 0,
      change: crm.enquiries?.change ?? 0,
      icon: FileSearch,
      href: '/dashboard/enquiries',
      iconWrap: 'bg-blue-100 text-blue-600',
      card: 'border-blue-200 bg-gradient-to-br from-blue-50/80 to-white hover:border-blue-400',
    },
    {
      label: 'Total Contacts',
      value: crm.contacts.total,
      change: crm.contacts.change,
      icon: Contact2,
      href: '/dashboard/contacts',
      iconWrap: 'bg-emerald-100 text-emerald-600',
      card: 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white hover:border-emerald-400',
    },
    {
      label: 'Active Companies',
      value: crm.companies.total,
      change: crm.companies.change,
      icon: Building2,
      href: '/dashboard/companies',
      iconWrap: 'bg-violet-100 text-violet-600',
      card: 'border-violet-200 bg-gradient-to-br from-violet-50/80 to-white hover:border-violet-400',
    },
    {
      label: 'Opportunities',
      value: crm.opportunities.total,
      change: crm.opportunities.change,
      icon: Target,
      href: '/dashboard/opportunities',
      iconWrap: 'bg-amber-100 text-amber-600',
      card: 'border-amber-200 bg-gradient-to-br from-amber-50/80 to-white hover:border-amber-400',
    },
  ];

  const enquiriesByStage: Record<string, number> = crm.enquiriesByStage || {};
  const pipelineTotal = Object.values(enquiriesByStage).reduce((a: number, b) => a + Number(b || 0), 0);
  const pipelineRows = ENQUIRY_STAGES_ORDER
    .filter((s) => enquiriesByStage[s])
    .map((s) => ({
      key: s,
      ...ENQUIRY_STAGE_META[s],
      count: enquiriesByStage[s] || 0,
      pct: pipelineTotal ? Math.round(((enquiriesByStage[s] || 0) / pipelineTotal) * 100) : 0,
    }));

  const priorityEntries = Object.entries((crm.enquiriesByPriority || {}) as Record<string, number>)
    .sort((a, b) => b[1] - a[1]);
  const sourceTotal = priorityEntries.reduce((a, [, v]) => a + v, 0);

  const quickActions = [
    { label: isSuperAdmin || inOperations ? 'Operations pipeline' : 'Enquiries', icon: Inbox, href: isSuperAdmin || inOperations ? '/dashboard/operations' : '/dashboard/enquiries' },
    { label: 'New Enquiry', icon: FileSearch, href: '/dashboard/enquiries/new' },
    { label: 'Add Contact', icon: Contact2, href: '/dashboard/contacts' },
    { label: 'Tasks', icon: CheckSquare, href: '/dashboard/tasks' },
    { label: 'New Quote', icon: Plus, href: '/dashboard/quotations' },
    { label: 'Opportunities', icon: Target, href: '/dashboard/opportunities' },
  ];

  return (
    <div className="space-y-6">
      <AnnouncementsWidget />

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">CRM Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome {displayName} 👋 — manage your enquiries, relationships and business opportunities
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{formatUkDate(new Date())}</p>
      </div>

      {!isLoading && role === 'super_admin' && punchStats && punchStats.pending > 0 && (
        <div className="rounded-2xl border border-amber-200 border-l-4 border-l-amber-500 bg-amber-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-medium">{punchStats.pending} punch requests need review</p>
                <p className="text-xs text-muted-foreground">Employees waiting for approval</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/punch-requests')}>
              Review <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          const up = (item.change ?? 0) >= 0;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => router.push(item.href)}
              className={`rounded-2xl border p-4 text-left shadow-sm transition ${item.card}`}
            >
              <div className="flex items-start justify-between">
                <span className={`rounded-xl p-2.5 ${item.iconWrap}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-xs font-medium text-muted-foreground">{item.label}</p>
              <p className="text-3xl font-bold tabular-nums text-slate-900">{isLoading ? '—' : item.value.toLocaleString()}</p>
              <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
                {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(item.change ?? 0)}% vs last month
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Main column */}
        <div className="space-y-4 xl:col-span-8">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Pipeline overview */}
            <Card className="rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <Filter className="h-4 w-4 text-blue-600" />
                  Pipeline Overview
                </h2>
                <Link href="/dashboard/enquiries" className="text-xs font-medium text-blue-600 hover:underline">
                  View all
                </Link>
              </div>
              {pipelineRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No enquiries yet — add your first enquiry to see the pipeline.</p>
              ) : (
                <div className="space-y-3">
                  {pipelineRows.map((row) => (
                    <div key={row.key}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{row.label}</span>
                        <span className="text-muted-foreground">
                          {row.count} · {row.pct}%
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${row.bar}`}
                          style={{ width: `${Math.max(4, row.pct)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Enquiries by priority donut */}
            <Card className="rounded-2xl p-5">
              <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-slate-800">
                <PieChart className="h-4 w-4 text-violet-600" />
                Enquiries by Priority
              </h2>
              {sourceTotal === 0 ? (
                <p className="text-sm text-muted-foreground">No enquiry data yet.</p>
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <Donut
                    centerLabel="Enquiries"
                    segments={priorityEntries.map(([, v], i) => ({ value: v, color: DONUT_COLORS[i % DONUT_COLORS.length] }))}
                    total={sourceTotal}
                  />
                  <ul className="min-w-[140px] flex-1 space-y-1.5">
                    {priorityEntries.map(([src, v], i) => (
                      <li key={src} className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex items-center gap-2 capitalize">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                          />
                          {PRIORITY_LABELS[src] || src}
                        </span>
                        <span className="font-medium text-slate-700">
                          {Math.round((v / sourceTotal) * 100)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Recent enquiries */}
            <Card className="rounded-2xl p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Recent Enquiries
                </h2>
                <Link href="/dashboard/enquiries" className="text-xs font-medium text-blue-600 hover:underline">
                  View all
                </Link>
              </div>
              {(crm.recentEnquiries || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No enquiries yet.</p>
              ) : (
                <div className="space-y-2">
                  {(crm.recentEnquiries || []).map((e: any) => {
                    const stage = (e.stage || 'new_enquiry') as EnquiryStage;
                    const meta = ENQUIRY_STAGE_META[stage] || ENQUIRY_STAGE_META.new_enquiry;
                    const title = e.title || e.requirement || e.enquiry_number;
                    return (
                      <div
                        key={e.id}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2 hover:bg-slate-50"
                        onClick={() => router.push(`/dashboard/enquiries/${e.id}`)}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-50 text-xs text-blue-700">
                              {initials(e.prospect_name || title)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{title}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {e.enquiry_number}
                              {e.prospect_name ? ` · ${e.prospect_name}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.badge}`}>
                            {meta.label}
                          </span>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {e.created_at ? formatUkDate(e.created_at) : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Upcoming tasks */}
            <Card className="rounded-2xl p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <CheckSquare className="h-4 w-4 text-violet-600" />
                  Upcoming Tasks
                </h2>
                <Link
                  href={isSuperAdmin ? '/dashboard/tasks?view=team' : '/dashboard/tasks'}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  View all
                </Link>
              </div>
              {myTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open tasks.</p>
              ) : (
                <div className="space-y-2">
                  {myTasks.slice(0, 6).map((task: any) => (
                    <div
                      key={task.id}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-violet-100 bg-violet-50/40 px-3 py-2 hover:bg-violet-50"
                      onClick={() => router.push('/dashboard/tasks')}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.assignee_name ? `${task.assignee_name} · ` : ''}
                          {task.due_date ? formatUkDate(task.due_date) : 'No due date'}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${taskStatusStyle(task.status)}`}>
                        {taskStatusLabel(task.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <HomeCalendar />
        </div>

        {/* Right rail */}
        <div className="space-y-4 xl:col-span-4">
          <Card className="rounded-2xl p-5">
            <h2 className="mb-3 text-base font-semibold text-slate-800">Recent Activities</h2>
            <p className="mb-3 text-xs text-muted-foreground">Only your own actions appear here.</p>
            <div className="max-h-72 space-y-3 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-sm">You {friendlyAction(activity.action, activity.table_name)}</p>
                      <p className="text-xs text-muted-foreground">{relativeTime(activity.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="rounded-2xl p-5">
            <h2 className="mb-3 text-base font-semibold text-slate-800">⚡ Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() => router.push(a.href)}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50/40 px-2 py-3 text-center transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <Icon className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-slate-700">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="rounded-2xl border-amber-100 p-5">
            <h2 className="mb-3 text-base font-semibold text-amber-800">On Leave Today</h2>
            {onLeaveToday.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one is on leave today.</p>
            ) : (
              <div className="space-y-2">
                {onLeaveToday.map((row: { id: string; name: string; start_date?: string; end_date?: string }) => (
                  <div key={row.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-amber-50 text-xs text-amber-800">
                        {initials(row.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{row.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.start_date ? formatUkDate(row.start_date) : ''}
                        {row.end_date ? ` – ${formatUkDate(row.end_date)}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
