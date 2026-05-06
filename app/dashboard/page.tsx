'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDashboardStats } from '@/lib/api/dashboard';
import { getPunchStats } from '@/lib/api/clock';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  Award,
  Users,
  Shield,
  Package,
  ShoppingCart,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  FolderKanban,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { role } = useCurrentUser();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  const { data: punchStats } = useQuery({
    queryKey: ['punchStats'],
    queryFn: getPunchStats,
    enabled: role === 'super_admin',
  });

  const stats = dashboardData?.stats || {
    projects: 0,
    buyers: 0,
    vendors: 0,
    certifications: 0,
    memberships: 0,
    partnerships: 0,
    insurance: 0,
    documents: 0,
    alerts: 0,
    hoursToday: 0,
  };

  const pipelineOverview = dashboardData?.pipelineOverview || {};
  const recentActivity = dashboardData?.recentActivity || [];
  const upcomingEvents = dashboardData?.upcomingEvents || [];
  const myTasks = dashboardData?.myTasks || [];
  const myProjects = dashboardData?.myProjects || [];
  const [myPanel, setMyPanel] = useState<'tasks' | 'projects'>('tasks');

  const moduleCards = [
    { name: 'Projects', count: stats.projects, icon: FolderKanban, href: '/dashboard/projects', color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { name: 'Buyers', count: stats.buyers, icon: ShoppingCart, href: '/dashboard/buyers', color: 'text-purple-600', bg: 'bg-purple-500/10' },
    { name: 'Vendors', count: stats.vendors, icon: Package, href: '/dashboard/vendors', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { name: 'Certifications', count: stats.certifications, icon: Award, href: '/dashboard/certifications', color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { name: 'Memberships', count: stats.memberships, icon: Users, href: '/dashboard/memberships', color: 'text-cyan-600', bg: 'bg-cyan-500/10' },
    { name: 'Partnerships', count: stats.partnerships, icon: Shield, href: '/dashboard/partnerships', color: 'text-rose-600', bg: 'bg-rose-500/10' },
    { name: 'Insurance', count: stats.insurance, icon: Shield, href: '/dashboard/insurance', color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
    { name: 'Documents', count: stats.documents, icon: FileText, href: '/dashboard/documents', color: 'text-gray-600', bg: 'bg-gray-500/10' },
  ];

  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const roleLabel = role ? role.replaceAll('_', ' ') : 'user';
  const greeting =
    today.getHours() < 12
      ? 'Good morning'
      : today.getHours() < 18
        ? 'Good afternoon'
        : 'Good evening';

  const hashToHue = (input: string) => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
    return hash % 360;
  };

  const initialsFromName = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || 'U';
    const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : (parts[0]?.[1] || '');
    return (first + (second || '')).toUpperCase().slice(0, 2);
  };

  const relativeTime = (iso?: string) => {
    if (!iso) return '';
    const diffMs = Date.now() - new Date(iso).getTime();
    if (!Number.isFinite(diffMs)) return '';
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* header */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {greeting}, <span className="capitalize">{roleLabel}</span>
            </h1>
            <p className="text-sm text-muted-foreground">{dateLabel}</p>
          </div>
          <div className="w-full md:w-[360px]">
            <input
              placeholder="Search…"
              className="h-10 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:ring-0"
            />
          </div>
        </div>
      </div>

      {/* KPI bar */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-4 rounded-2xl overflow-hidden border border-border">
          {[
            {
              label: 'Total Active Projects',
              value: stats.projects,
              trendIcon: TrendingUp,
              trendText: '+12% this month',
              trendClass: 'text-emerald-600',
            },
            {
              label: 'Total Buyers',
              value: stats.buyers,
              trendIcon: TrendingUp,
              trendText: '+8% this month',
              trendClass: 'text-emerald-600',
            },
            {
              label: 'Pending Alerts',
              value: stats.alerts,
              trendIcon: TrendingDown,
              trendText: '-3% this month',
              trendClass: 'text-amber-600',
            },
            {
              label: 'Hours Clocked Today',
              value: stats.hoursToday.toFixed(1),
              trendIcon: TrendingUp,
              trendText: '+5% this week',
              trendClass: 'text-emerald-600',
            },
          ].map((kpi) => {
            const TrendIcon = kpi.trendIcon;
            return (
              <div key={kpi.label} className="bg-card p-6">
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className="text-5xl font-semibold mt-2 tabular-nums">{kpi.value}</p>
                <div className="flex items-center gap-1 mt-3">
                  <TrendIcon className={`h-4 w-4 ${kpi.trendClass}`} />
                  <span className={`text-xs ${kpi.trendClass}`}>{kpi.trendText}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Punch Request Alert */}
      {!isLoading && role === 'super_admin' && punchStats && punchStats.pending > 0 && (
        <div className="rounded-2xl border-l-4 border-l-amber-500 border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{punchStats.pending} punch requests need review</p>
                <p className="text-xs text-muted-foreground">Employees waiting for approval</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/punch-requests')}>
              Review <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* middle section */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5">
            <Card className="rounded-2xl border border-border bg-card p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium">Activity</h3>
                <button className="text-xs text-primary hover:underline transition-all duration-150">View all</button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {recentActivity.slice(0, 10).map((activity: any) => {
                  const name = String(activity.users?.full_name || activity.users?.email || 'User');
                  const initials = initialsFromName(name);
                  const hue = hashToHue(name);
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 rounded-2xl p-2 hover:bg-muted/40 transition-all duration-150"
                    >
                      <div
                        className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                        style={{ backgroundColor: `hsl(${hue} 70% 45%)` }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{name}</span>{' '}
                          <span className="text-muted-foreground">{activity.action}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{relativeTime(activity.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
                {recentActivity.length === 0 && <p className="text-sm text-muted-foreground">No recent activity</p>}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card className="rounded-2xl border border-border bg-card p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium">This Week</h3>
                <button
                  className="text-xs text-primary hover:underline transition-all duration-150"
                  onClick={() => router.push('/dashboard/calendar')}
                >
                  Open calendar
                </button>
              </div>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {upcomingEvents.slice(0, 10).map((event: any) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 rounded-full ${event.event_type === 'holiday' ? 'bg-gray-400' : 'bg-blue-500'}`} />
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {event.start_time ? `, ${event.start_time}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
                {upcomingEvents.length === 0 && <p className="text-sm text-muted-foreground">No upcoming events</p>}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="rounded-2xl border border-border bg-card p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium">{myPanel === 'tasks' ? 'My Tasks' : 'My Projects'}</h3>
                <button
                  className="text-xs text-primary hover:underline transition-all duration-150"
                  onClick={() => router.push(myPanel === 'tasks' ? '/dashboard/tasks' : '/dashboard/projects')}
                >
                  View all
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <button
                  className={`text-xs px-3 py-1 rounded-full border border-border transition-all duration-150 ${myPanel === 'tasks' ? 'bg-muted' : 'hover:bg-muted/40'}`}
                  onClick={() => setMyPanel('tasks')}
                >
                  Tasks
                </button>
                <button
                  className={`text-xs px-3 py-1 rounded-full border border-border transition-all duration-150 ${myPanel === 'projects' ? 'bg-muted' : 'hover:bg-muted/40'}`}
                  onClick={() => setMyPanel('projects')}
                >
                  Projects
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {myPanel === 'tasks' ? (
                  <>
                    {myTasks.slice(0, 8).map((task: any) => (
                      <div
                        key={task.id}
                        className="rounded-2xl border border-border p-3 cursor-pointer hover:bg-muted/40 transition-all duration-150"
                        onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                      >
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                        </p>
                      </div>
                    ))}
                    {myTasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks assigned</p>}
                  </>
                ) : (
                  <>
                    {myProjects.slice(0, 8).map((project: any) => (
                      <div
                        key={project.id}
                        className="rounded-2xl border border-border p-3 cursor-pointer hover:bg-muted/40 transition-all duration-150"
                        onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                      >
                        <p className="text-sm font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.end_date ? `End: ${new Date(project.end_date).toLocaleDateString()}` : 'No end date'}
                        </p>
                      </div>
                    ))}
                    {myProjects.length === 0 && <p className="text-sm text-muted-foreground">No projects assigned</p>}
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* modules grid */}
      {!isLoading && (
        <div>
          <h3 className="text-base font-medium mb-4">Modules</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {moduleCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.name}
                  onClick={() => router.push(card.href)}
                  className="rounded-2xl border border-border bg-card p-4 cursor-pointer 
                 hover:border-border/80 transition-all duration-150 
                 flex flex-col items-center gap-2 text-center"
                >
                  <div className={`rounded-xl ${card.bg} p-2`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <p className="text-sm font-medium leading-tight">{card.name}</p>
                  <p className="text-2xl font-bold tabular-nums">{card.count}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* pipeline */}
      {!isLoading && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-base font-medium mb-4">Buyer Pipeline</h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {Object.entries(pipelineOverview).map(([stage, data]: [string, any]) => (
              <div key={stage} className="flex-shrink-0 flex flex-col items-center gap-1">
                <div
                  className="h-9 rounded-full px-4 flex items-center text-xs font-medium text-white whitespace-nowrap"
                  style={{ backgroundColor: data.color }}
                >
                  {stage}
                </div>
                <span className="text-xs font-semibold tabular-nums">{data.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* alerts */}
      {!isLoading && stats.alerts > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <span className="text-sm font-medium text-amber-900 dark:text-amber-200">
              {stats.alerts} pending alerts
            </span>
            <button
              className="ml-auto text-xs text-amber-700 dark:text-amber-300 hover:underline transition-all duration-150"
              onClick={() => router.push('/dashboard/alerts')}
            >
              View alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}