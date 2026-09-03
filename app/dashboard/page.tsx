'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getDashboardStats } from '@/lib/api/dashboard';
import { getPunchStats } from '@/lib/api/clock';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ROLE_LABELS } from '@/lib/roles';
import {
  AlertTriangle,
  ArrowRight,
  FolderKanban,
  CheckSquare,
  FileText,
  FileSearch,
  CreditCard,
} from 'lucide-react';
import { AnnouncementsWidget } from '@/components/announcements/AnnouncementsWidget';
import { HomeCalendar } from '@/components/dashboard/HomeCalendar';
import { useIsClient } from '@/hooks/useIsClient';
import { formatUkDate } from '@/lib/date';

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
  if (diffHr < 24) return 'Today';
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

export default function DashboardPage() {
  const router = useRouter();
  const isClient = useIsClient();
  const { role, profile, user, isSuperAdmin } = useCurrentUser();
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

  const stats = dashboardData?.stats || {
    projects: 0,
    tasks: 0,
    invoices: 0,
    quotations: 0,
    payments: 0,
    alerts: 0,
  };

  const recentActivity = dashboardData?.recentActivity || [];
  const myTasks = dashboardData?.myTasks || [];
  const onLeaveToday = dashboardData?.onLeaveToday || [];
  const displayName = isClient ? mountedName || 'there' : 'there';
  const roleLabel = ROLE_LABELS[role] || profile?.designation || 'Team member';

  const summary = [
    {
      label: 'Projects',
      value: stats.projects,
      icon: FolderKanban,
      href: '/dashboard/projects',
      card: 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:border-blue-400',
      iconWrap: 'bg-blue-500 text-white',
      valueClass: 'text-blue-800',
    },
    {
      label: 'Tasks',
      value: stats.tasks ?? 0,
      icon: CheckSquare,
      href: '/dashboard/tasks',
      card: 'border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 hover:border-violet-400',
      iconWrap: 'bg-violet-500 text-white',
      valueClass: 'text-violet-800',
    },
    {
      label: 'Invoices',
      value: stats.invoices ?? 0,
      icon: FileText,
      href: '/dashboard/invoices',
      card: 'border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 hover:border-teal-400',
      iconWrap: 'bg-teal-500 text-white',
      valueClass: 'text-teal-800',
    },
    {
      label: 'Estimates',
      value: stats.quotations,
      icon: FileSearch,
      href: '/dashboard/quotations',
      card: 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 hover:border-amber-400',
      iconWrap: 'bg-amber-500 text-white',
      valueClass: 'text-amber-800',
    },
    {
      label: 'Payments',
      value: stats.payments ?? 0,
      icon: CreditCard,
      href: '/dashboard/finance/credit-status',
      card: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-lime-50 hover:border-emerald-400',
      iconWrap: 'bg-emerald-500 text-white',
      valueClass: 'text-emerald-800',
    },
  ];

  return (
    <div className="space-y-6">
      <AnnouncementsWidget />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : null}

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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-5">
          <div>
            <p className="bg-gradient-to-r from-blue-700 via-violet-600 to-teal-600 bg-clip-text text-3xl font-semibold tracking-tight text-transparent">
              Welcome {displayName} 👋
            </p>
          </div>

          <Card className="rounded-2xl border-blue-100 bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-500 p-5 text-white shadow-md">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-white/50">
                <AvatarFallback className="bg-white/20 text-lg text-white">
                  {initials(displayName === 'there' ? '' : displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold text-white">{displayName === 'there' ? '…' : displayName}</p>
                <p className="text-sm text-white/80">{profile?.designation || roleLabel}</p>
              </div>
              <Button className="bg-white text-emerald-700 hover:bg-emerald-50" onClick={() => router.push('/dashboard/tasks')}>
                + Create
              </Button>
            </div>
          </Card>

          {!isLoading && (
            <div className="grid grid-cols-3 gap-3">
              {summary.slice(0, 3).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => router.push(item.href)}
                    className={`rounded-2xl border p-4 text-left shadow-sm transition ${item.card}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">{item.label}</span>
                      <span className={`rounded-lg p-1.5 ${item.iconWrap}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <p className={`text-2xl font-semibold tabular-nums ${item.valueClass}`}>{item.value}</p>
                  </button>
                );
              })}
            </div>
          )}

          {!isLoading && (
            <div className="grid grid-cols-2 gap-3">
              {summary.slice(3).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => router.push(item.href)}
                    className={`rounded-2xl border p-4 text-left shadow-sm transition ${item.card}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">{item.label}</span>
                      <span className={`rounded-lg p-1.5 ${item.iconWrap}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <p className={`text-2xl font-semibold tabular-nums ${item.valueClass}`}>{item.value}</p>
                  </button>
                );
              })}
            </div>
          )}

          <Card className="rounded-2xl border-violet-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-violet-800">{isSuperAdmin ? 'Tasks' : 'My Tasks'}</h2>
              <button
                className="text-xs font-medium text-violet-600 hover:underline"
                onClick={() => router.push(isSuperAdmin ? '/dashboard/tasks?view=team' : '/dashboard/tasks')}
              >
                View all
              </button>
            </div>
            <div className="space-y-2">
              {myTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open tasks.</p>
              ) : (
                myTasks.slice(0, 8).map((task: any) => (
                  <div
                    key={task.id}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-violet-100 bg-violet-50/40 px-3 py-2.5 hover:bg-violet-50"
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
                ))
              )}
            </div>
          </Card>

          <Card className="rounded-2xl border-emerald-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-emerald-800">My Activity</h2>
            <p className="mb-3 text-xs text-muted-foreground">Only your own actions appear here.</p>
            <div className="max-h-64 space-y-3 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-sm">
                        You {friendlyAction(activity.action, activity.table_name)}
                      </p>
                      <p className="text-xs text-muted-foreground">{relativeTime(activity.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="rounded-2xl border-amber-100 bg-white p-5 shadow-sm">
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

        <div className="xl:col-span-7">
          <HomeCalendar />
        </div>
      </div>
    </div>
  );
}
