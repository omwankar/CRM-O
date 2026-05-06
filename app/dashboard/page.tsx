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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-medium text-foreground">Dashboard</h1>
        <p className="text-[14px] text-muted-foreground">Welcome to your CRM portal</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Card key={i} className="h-32 animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] text-muted-foreground">Total Active Projects</p>
                  <p className="mt-2 text-[32px] font-medium text-foreground">{stats.projects}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-600" />
                    <span className="text-[12px] text-emerald-600">+12% this month</span>
                  </div>
                </div>
                <div className="rounded-lg bg-blue-500/10 p-2">
                  <FolderKanban className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] text-muted-foreground">Total Buyers</p>
                  <p className="mt-2 text-[32px] font-medium text-foreground">{stats.buyers}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-600" />
                    <span className="text-[12px] text-emerald-600">+8% this month</span>
                  </div>
                </div>
                <div className="rounded-lg bg-purple-500/10 p-2">
                  <ShoppingCart className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] text-muted-foreground">Pending Alerts</p>
                  <p className="mt-2 text-[32px] font-medium text-foreground">{stats.alerts}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-amber-600" />
                    <span className="text-[12px] text-amber-600">-3% this month</span>
                  </div>
                </div>
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] text-muted-foreground">Hours Clocked Today</p>
                  <p className="mt-2 text-[32px] font-medium text-foreground">{stats.hoursToday.toFixed(1)}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-600" />
                    <span className="text-[12px] text-emerald-600">+5% this week</span>
                  </div>
                </div>
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <Clock className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Punch Request Alert for Super Admin */}
          {role === 'super_admin' && punchStats && punchStats.pending > 0 && (
            <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-900">
                      {punchStats.pending} punch request{punchStats.pending > 1 ? 's' : ''} need your review
                    </p>
                    <p className="text-sm text-amber-700">Employees are waiting for approval</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/punch-requests')}
                  className="border-amber-300 hover:bg-amber-100"
                >
                  Review Requests
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="p-5 lg:col-span-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-medium text-foreground">Recent Activity</h3>
                <button className="text-[12px] text-primary hover:underline">View all</button>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recentActivity.slice(0, 8).map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-3 text-[13px]">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-foreground">
                        <span className="font-medium">{activity.users?.full_name || 'User'}</span>
                        <span className="text-muted-foreground"> {activity.action}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">{new Date(activity.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && <p className="text-[13px] text-muted-foreground">No recent activity</p>}
              </div>
            </Card>

            <Card className="p-5 lg:col-span-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-medium text-foreground">This Week</h3>
                <button className="text-[12px] text-primary hover:underline" onClick={() => router.push('/dashboard/calendar')}>Open calendar</button>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {upcomingEvents.slice(0, 6).map((event: any) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 rounded-full ${event.event_type === 'holiday' ? 'bg-gray-400' : 'bg-blue-500'}`} />
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{event.title}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}{event.start_time ? `, ${event.start_time}` : ''}</p>
                    </div>
                  </div>
                ))}
                {upcomingEvents.length === 0 && <p className="text-[13px] text-muted-foreground">No upcoming events</p>}
              </div>
            </Card>

            <Card className="p-5 lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    className={myPanel === 'tasks' ? 'text-[16px] font-medium text-foreground' : 'text-[16px] font-medium text-muted-foreground hover:text-foreground'}
                    onClick={() => setMyPanel('tasks')}
                  >
                    My Tasks
                  </button>
                  <span className="text-muted-foreground">/</span>
                  <button
                    className={myPanel === 'projects' ? 'text-[16px] font-medium text-foreground' : 'text-[16px] font-medium text-muted-foreground hover:text-foreground'}
                    onClick={() => setMyPanel('projects')}
                  >
                    My Projects
                  </button>
                </div>
                <button
                  className="text-[12px] text-primary hover:underline"
                  onClick={() => router.push(myPanel === 'tasks' ? '/dashboard/tasks' : '/dashboard/projects')}
                >
                  View all
                </button>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {myPanel === 'tasks' ? (
                  <>
                    {myTasks.slice(0, 6).map((task: any) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-2 cursor-pointer hover:bg-muted/40 rounded-md p-2 -mx-2"
                        onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                      >
                        <input type="checkbox" className="mt-1 h-4 w-4 rounded border-border" onClick={(e) => e.stopPropagation()} />
                        <div className="flex-1">
                          <p className="text-[13px] font-medium text-foreground">{task.title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {myTasks.length === 0 && <p className="text-[13px] text-muted-foreground">No tasks assigned</p>}
                  </>
                ) : (
                  <>
                    {myProjects.slice(0, 6).map((project: any) => (
                      <div
                        key={project.id}
                        className="cursor-pointer hover:bg-muted/40 rounded-md p-2 -mx-2"
                        onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                      >
                        <p className="text-[13px] font-medium text-foreground">{project.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {project.end_date ? `End: ${new Date(project.end_date).toLocaleDateString()}` : 'No end date'}
                        </p>
                      </div>
                    ))}
                    {myProjects.length === 0 && <p className="text-[13px] text-muted-foreground">No projects assigned</p>}
                  </>
                )}
              </div>
            </Card>
          </div>

          <div>
            <h3 className="text-[16px] font-medium text-foreground mb-4">Modules</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
              {moduleCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Card
                    key={card.name}
                    className="cursor-pointer p-4 transition-all hover:border-border/60"
                    onClick={() => router.push(card.href)}
                  >
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className={`rounded-lg ${card.bg} p-2`}>
                        <Icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-foreground">{card.name}</p>
                        <p className="text-[20px] font-bold text-foreground">{card.count}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <Card className="p-5">
            <h3 className="text-[16px] font-medium text-foreground mb-4">Buyer Pipeline</h3>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {Object.entries(pipelineOverview).map(([stage, data]: [string, any]) => (
                <div key={stage} className="flex-shrink-0 flex flex-col items-center gap-2">
                  <div
                    className="h-8 rounded-full px-4 flex items-center justify-center text-[12px] font-medium text-white"
                    style={{ backgroundColor: data.color }}
                  >
                    {stage} ({data.count})
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {stats.alerts > 0 && (
            <Card className="p-4 bg-amber-50 border-amber-200">
              <div className="flex items-center gap-4 overflow-x-auto">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div className="flex gap-3">
                  <span className="text-[13px] text-amber-900 font-medium">{stats.alerts} pending alerts</span>
                  <button className="text-[12px] text-amber-700 hover:underline" onClick={() => router.push('/dashboard/alerts')}>View alerts</button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}