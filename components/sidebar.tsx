'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Menu, X, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useQuery } from '@tanstack/react-query';
import { getPunchStats } from '@/lib/api/clock';

type MenuItem = {
  label: string;
  href: string;
  badge?: number;
  /** Open in a new browser tab (e.g. standalone Operations Pipeline). */
  newTab?: boolean;
};

type MenuSection = {
  label: string;
  items: MenuItem[];
  tone?: {
    label: string;
    active: string;
    dot: string;
    hover: string;
  };
};

const SECTION_TONES: Record<string, MenuSection['tone']> = {
  Overview: {
    label: 'text-blue-500',
    active: 'bg-blue-50 text-blue-700 font-medium',
    dot: 'bg-blue-500',
    hover: 'hover:bg-blue-50/80 hover:text-blue-800',
  },
  Attendance: {
    label: 'text-teal-500',
    active: 'bg-teal-50 text-teal-700 font-medium',
    dot: 'bg-teal-500',
    hover: 'hover:bg-teal-50/80 hover:text-teal-800',
  },
  HR: {
    label: 'text-fuchsia-500',
    active: 'bg-fuchsia-50 text-fuchsia-700 font-medium',
    dot: 'bg-fuchsia-500',
    hover: 'hover:bg-fuchsia-50/80 hover:text-fuchsia-800',
  },
  Sales: {
    label: 'text-violet-500',
    active: 'bg-violet-50 text-violet-700 font-medium',
    dot: 'bg-violet-500',
    hover: 'hover:bg-violet-50/80 hover:text-violet-800',
  },
  Operations: {
    label: 'text-amber-500',
    active: 'bg-amber-50 text-amber-800 font-medium',
    dot: 'bg-amber-500',
    hover: 'hover:bg-amber-50/80 hover:text-amber-900',
  },
  Finance: {
    label: 'text-emerald-500',
    active: 'bg-emerald-50 text-emerald-700 font-medium',
    dot: 'bg-emerald-500',
    hover: 'hover:bg-emerald-50/80 hover:text-emerald-800',
  },
  Administration: {
    label: 'text-indigo-500',
    active: 'bg-indigo-50 text-indigo-700 font-medium',
    dot: 'bg-indigo-500',
    hover: 'hover:bg-indigo-50/80 hover:text-indigo-800',
  },
  Other: {
    label: 'text-rose-500',
    active: 'bg-rose-50 text-rose-700 font-medium',
    dot: 'bg-rose-500',
    hover: 'hover:bg-rose-50/80 hover:text-rose-800',
  },
};

function getMenuSections(role?: string, pendingCount?: number, showPipeline?: boolean): MenuSection[] {
  const isSuperAdmin = role === 'super_admin';
  const canAccessHr = role === 'manager' || role === 'super_admin' || role === 'admin';

  const sections: MenuSection[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Timesheet', href: '/dashboard/timesheet' },
        { label: 'Tasks', href: '/dashboard/tasks' },
        { label: 'Alerts & Notifications', href: '/dashboard/alerts' },
      ],
    },
    {
      label: 'Attendance',
      items: [
        { label: 'Clock In/Out', href: '/dashboard/clock' },
        { label: 'Leave Tracker', href: '/dashboard/leave-tracker' },
        { label: 'Holidays', href: '/dashboard/holidays' },
        { label: 'Calendar', href: '/dashboard/calendar' },
        ...(isSuperAdmin
          ? [
              { label: 'Punch Requests', href: '/dashboard/punch-requests', badge: pendingCount },
              { label: 'Mark Leave', href: '/dashboard/mark-leave' },
            ]
          : []),
      ],
    },
    {
      label: 'Sales',
      items: [
        { label: 'Enquiries', href: '/dashboard/enquiries' },
        { label: 'Leads', href: '/dashboard/leads' },
        { label: 'Opportunities', href: '/dashboard/opportunities' },
        { label: 'Contacts', href: '/dashboard/contacts' },
        { label: 'Activities', href: '/dashboard/activities' },
        { label: 'Quotations', href: '/dashboard/quotations' },
        { label: 'Sales Reports', href: '/dashboard/sales-reports' },
        { label: 'Companies', href: '/dashboard/companies' },
        { label: 'Buyers', href: '/dashboard/buyers' },
        { label: 'Vendors', href: '/dashboard/vendors' },
      ],
    },
    {
      label: 'Operations',
      items: [
        ...(showPipeline ? [{ label: 'Pipeline', href: '/operations', newTab: true }] : []),
        { label: 'Jobs / Shipments', href: '/dashboard/jobs' },
        { label: 'Projects', href: '/dashboard/projects' },
        { label: 'Vendors', href: '/dashboard/vendors' },
        { label: 'Partners', href: '/dashboard/partnerships' },
      ],
    },
    {
      label: 'Finance',
      items: [
        { label: 'Invoices', href: '/dashboard/invoices' },
        ...(role === 'manager' || role === 'super_admin' || role === 'admin'
          ? [{ label: 'Credit status', href: '/dashboard/finance/credit-status' }]
          : []),
      ],
    },
    {
      label: 'Administration',
      items: [
        { label: 'Certifications', href: '/dashboard/certifications' },
        { label: 'Memberships', href: '/dashboard/memberships' },
        { label: 'Insurance', href: '/dashboard/insurance' },
        { label: 'Documents', href: '/dashboard/documents' },
        { label: isSuperAdmin ? 'Company Inbox' : 'My Inbox', href: '/dashboard/emails' },
        ...(isSuperAdmin ? [{ label: 'Users', href: '/dashboard/users' }] : []),
        { label: 'Settings', href: '/dashboard/settings' },
      ],
    },
    {
      label: 'Other',
      items: [
        { label: 'Announcements', href: '/dashboard/announcements' },
        { label: 'Knowledge Base', href: '/dashboard/knowledge' },
        { label: 'Event Manager', href: '/dashboard/events' },
        { label: 'Reports', href: '/dashboard/reports' },
      ],
    },
  ];

  if (canAccessHr) {
    sections.splice(2, 0, {
      label: 'HR',
      items: [
        { label: 'Employees', href: '/dashboard/hr/employees' },
        { label: 'Attendance', href: '/dashboard/hr/attendance' },
        { label: 'Holiday', href: '/dashboard/hr/holidays' },
        { label: 'Appreciation', href: '/dashboard/hr/appreciations' },
      ],
    });
  }

  return sections;
}

function isItemActive(pathname: string, href: string, search: string = '') {
  if (href === '/dashboard') return pathname === '/dashboard';
  // Standalone pipeline tab — never mark active in the CRM sidebar.
  if (href === '/operations') return false;

  if (href.startsWith('/dashboard/tasks')) {
    return pathname === '/dashboard/tasks' || pathname.startsWith('/dashboard/tasks/');
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : '';
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  // Defer role-based menu items until after mount so SSR HTML matches first client paint
  // (otherwise Punch Requests / HR appear only on client and cause hydration mismatch).
  const [menuReady, setMenuReady] = useState(false);
  const { role, profile, isLoading, inOperations } = useCurrentUser();

  useEffect(() => {
    setMenuReady(true);
  }, []);

  const { data: punchStats } = useQuery({
    queryKey: ['punchStatsSidebar'],
    queryFn: getPunchStats,
    enabled: menuReady && role === 'super_admin',
    refetchInterval: 60000,
  });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const pendingCount = punchStats?.pending || 0;
  const menuSections = getMenuSections(
    menuReady && !isLoading ? role : undefined,
    pendingCount,
    menuReady && !isLoading && (role === 'super_admin' || inOperations),
  );

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) throw new Error('Logout failed');
    } catch {
      const { signOut } = await import('@/lib/auth');
      await signOut();
    } finally {
      try {
        sessionStorage.removeItem('crm.currentProfile');
      } catch {
        /* ignore */
      }
      router.replace('/auth/login');
      router.refresh();
    }
  };

  const renderNav = (isCollapsed: boolean) => (
    <>
      <div className="h-16 flex items-center px-5 border-b border-blue-100 shrink-0 bg-gradient-to-r from-blue-50 via-white to-teal-50">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-teal-400 overflow-hidden shadow-sm">
              <img
                src="/cropped-clarusto-logitics-e1756811318321-85x85 .png"
                alt="Logo"
                className="h-full w-full object-contain bg-white"
              />
            </div>
            <span className="font-semibold text-[15px] bg-gradient-to-r from-blue-700 to-teal-600 bg-clip-text text-transparent tracking-wide truncate">CRM</span>
          </div>
        ) : (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-teal-400 overflow-hidden">
            <img
              src="/cropped-clarusto-logitics-e1756811318321-85x85 .png"
              alt="Logo"
              className="h-full w-full object-contain bg-white"
            />
          </div>
        )}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-5 space-y-6">
        {menuSections.map((section) => (
          <div key={section.label}>
            {!isCollapsed && (
              <p
                className={cn(
                  'mb-2.5 px-2 text-[11px] font-semibold uppercase tracking-wide',
                  SECTION_TONES[section.label]?.label || 'text-slate-400',
                )}
              >
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isItemActive(pathname, item.href, search);
                const tone = SECTION_TONES[section.label];
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      target={item.newTab ? '_blank' : undefined}
                      rel={item.newTab ? 'noopener noreferrer' : undefined}
                      onClick={() => setOpen(false)}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
                        active
                          ? tone?.active || 'bg-blue-50 text-blue-700 font-medium'
                          : cn('text-slate-600', tone?.hover || 'hover:bg-slate-100 hover:text-slate-900'),
                        isCollapsed && 'justify-center px-0',
                      )}
                    >
                      {!isCollapsed && (
                        <span
                          className={cn(
                            'h-1.5 w-1.5 shrink-0 rounded-full',
                            active ? tone?.dot || 'bg-blue-600' : 'bg-slate-300',
                          )}
                        />
                      )}
                      {isCollapsed ? (
                        <span className="text-[11px] font-semibold uppercase tracking-wide">
                          {item.label.slice(0, 2)}
                        </span>
                      ) : (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge != null && item.badge > 0 && (
                            <span className="min-w-[18px] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-200 p-3 space-y-2">
        {!isCollapsed && (
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-500 text-white text-[12px] font-medium">
                {profile?.full_name ? (
                  profile.full_name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                ) : (
                  <User className="w-4 h-4" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate text-[13px] font-medium text-slate-800">
                {isLoading ? 'Loading...' : profile?.full_name || profile?.email || 'User'}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                {profile?.role ? `${profile.role}` : profile?.email || ''}
              </p>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size={isCollapsed ? 'icon' : 'default'}
          className={cn(
            'w-full justify-start gap-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900',
            isCollapsed && 'justify-center px-0',
          )}
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span className="text-[14px]">Sign Out</span>}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex w-full h-8 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 rounded-lg border border-blue-200 bg-white p-2 text-blue-700 shadow-sm md:hidden"
        aria-label="Toggle menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside
        className={cn(
          'hidden md:flex h-full min-h-0 shrink-0 flex-col border-r border-blue-100 bg-white/90 text-slate-700 shadow-[4px_0_24px_rgba(37,99,235,0.06)] transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <div className="flex h-full max-h-full min-h-0 flex-col">{renderNav(collapsed)}</div>
      </aside>

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full max-h-svh w-64 flex-col border-r border-blue-100 bg-white text-slate-700 transition-transform duration-300 md:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full max-h-full min-h-0 flex-col">{renderNav(false)}</div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
