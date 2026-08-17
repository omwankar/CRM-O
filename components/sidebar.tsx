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
};

type MenuSection = {
  label: string;
  items: MenuItem[];
};

function getMenuSections(role?: string, pendingCount?: number): MenuSection[] {
  const isSuperAdmin = role === 'super_admin';
  const canAccessHr = role === 'manager' || role === 'super_admin' || role === 'admin';

  const sections: MenuSection[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', href: '/dashboard' },
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
          ? [{ label: 'Punch Requests', href: '/dashboard/punch-requests', badge: pendingCount }]
          : []),
        { label: 'Time Log', href: '/dashboard/timelog' },
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
  const { role, profile, isLoading } = useCurrentUser();

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
  );

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) throw new Error('Logout failed');
    } catch {
      const { signOut } = await import('@/lib/auth');
      await signOut();
    } finally {
      router.replace('/auth/login');
      router.refresh();
    }
  };

  const renderNav = (isCollapsed: boolean) => (
    <>
      <div className="h-16 flex items-center px-5 border-b border-white/10 shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 overflow-hidden">
              <img
                src="/cropped-clarusto-logitics-e1756811318321-85x85 .png"
                alt="Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="font-semibold text-[15px] text-white tracking-wide truncate">CRM</span>
          </div>
        ) : (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-md bg-white/10 overflow-hidden">
            <img
              src="/cropped-clarusto-logitics-e1756811318321-85x85 .png"
              alt="Logo"
              className="h-full w-full object-contain"
            />
          </div>
        )}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-5 space-y-6">
        {menuSections.map((section) => (
          <div key={section.label}>
            {!isCollapsed && (
              <p className="mb-2.5 px-2 text-[13px] font-bold text-white">{section.label}</p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isItemActive(pathname, item.href, search);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
                        active
                          ? 'bg-[#2563eb] text-white font-medium'
                          : 'text-white/90 hover:bg-white/10 hover:text-white',
                        isCollapsed && 'justify-center px-0',
                      )}
                    >
                      {!isCollapsed && (
                        <span
                          className={cn(
                            'h-1.5 w-1.5 shrink-0 rounded-full',
                            active ? 'bg-white' : 'bg-white/80',
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

      <div className="shrink-0 border-t border-white/10 p-3 space-y-2">
        {!isCollapsed && (
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-white/15 text-white text-[12px] font-medium">
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
              <p className="truncate text-[13px] font-medium text-white">
                {isLoading ? 'Loading...' : profile?.full_name || profile?.email || 'User'}
              </p>
              <p className="truncate text-[11px] text-white/55">
                {profile?.role ? `${profile.role}` : profile?.email || ''}
              </p>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size={isCollapsed ? 'icon' : 'default'}
          className={cn(
            'w-full justify-start gap-3 text-white/70 hover:bg-white/10 hover:text-white',
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
          className="hidden md:flex w-full h-8 text-white/60 hover:bg-white/10 hover:text-white"
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
        className="fixed top-4 left-4 z-50 rounded-lg border border-white/20 bg-[#1a1f2e] p-2 text-white md:hidden"
        aria-label="Toggle menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside
        className={cn(
          'hidden md:flex h-full min-h-0 shrink-0 flex-col bg-[#1a1f2e] text-white transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <div className="flex h-full max-h-full min-h-0 flex-col">{renderNav(collapsed)}</div>
      </aside>

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full max-h-svh w-64 flex-col bg-[#1a1f2e] text-white transition-transform duration-300 md:hidden',
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
