'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Award,
  Users,
  Briefcase,
  Shield,
  Package,
  ShoppingCart,
  FileText,
  Clock3,
  CalendarDays,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronLeft,
  ChevronRight,
  User,
  FolderKanban,
  Timer,
  ListTodo,
  FileSearch,
  Heart,
  Palmtree,
  ClipboardList,
  PartyPopper,
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useQuery } from '@tanstack/react-query';
import { getPunchStats } from '@/lib/api/clock';

function getMenuSections(role?: string, pendingCount?: number) {
  const isSuperAdmin = role === 'super_admin';
  
  return [
    {
      label: 'OVERVIEW',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Alerts', href: '/dashboard/alerts', icon: Bell },
      ],
    },
    {
      label: 'MANAGE',
      items: [
        { label: 'Clock In/Out', href: '/dashboard/clock', icon: Clock3 },
        { label: 'Calendar', href: '/dashboard/calendar', icon: CalendarDays },
        ...(isSuperAdmin ? [{ label: 'Punch Requests', href: '/dashboard/punch-requests', icon: Timer, badge: pendingCount }] : []),
        { label: 'Certifications', href: '/dashboard/certifications', icon: Award },
        { label: 'Memberships', href: '/dashboard/memberships', icon: Users },
        { label: 'Partnerships', href: '/dashboard/partnerships', icon: Briefcase },
        { label: 'Insurance', href: '/dashboard/insurance', icon: Shield },
        { label: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
        { label: 'Tasks', href: '/dashboard/tasks', icon: ListTodo },
        { label: 'Quotations', href: '/dashboard/quotations', icon: FileSearch },
        { label: 'Vendors', href: '/dashboard/vendors', icon: Package },
        { label: 'Buyers', href: '/dashboard/buyers', icon: ShoppingCart },
        { label: 'Documents', href: '/dashboard/documents', icon: FileText },
      ],
    },
    {
      label: 'HR',
      items: [
        { label: 'Employees', href: '/dashboard/hr/employees', icon: Users },
        { label: 'Leaves', href: '/dashboard/hr/leaves', icon: Palmtree },
        { label: 'Attendance', href: '/dashboard/hr/attendance', icon: ClipboardList },
        { label: 'Holiday', href: '/dashboard/hr/holidays', icon: PartyPopper },
        { label: 'Appreciation', href: '/dashboard/hr/appreciations', icon: Heart },
      ],
    },
    {
      label: 'SETTINGS',
      items: [
        ...(isSuperAdmin ? [{ label: 'Users', href: '/dashboard/users', icon: Users }] : []),
        { label: 'Settings', href: '/dashboard/settings', icon: Settings },
      ],
    },
  ];
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { role, profile, isLoading } = useCurrentUser();
  
  const { data: punchStats } = useQuery({
    queryKey: ['punchStatsSidebar'],
    queryFn: getPunchStats,
    enabled: role === 'super_admin',
    refetchInterval: 60000,
  });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const pendingCount = punchStats?.pending || 0;
  const menuSections = getMenuSections(role, pendingCount);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Logout failed');
      }
    } catch (error) {
      // Fallback to client-side sign out if server logout fails.
      const { signOut } = await import('@/lib/auth');
      await signOut();
    } finally {
      router.replace('/auth/login');
      router.refresh();
    }
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 md:hidden rounded-lg border-[0.5px] border-border bg-card p-2"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar - Desktop: normal flex child, Mobile: fixed overlay */}
      <aside
        className={cn(
          'flex h-full min-h-0 shrink-0 flex-col border-r border-border bg-card transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-60',
          // Desktop: always visible, relative positioning
          'hidden md:flex',
          // Mobile: fixed overlay when open
          open && 'md:hidden fixed left-0 top-0 z-40 h-full max-h-svh'
        )}
      >
        <div className="flex min-h-0 h-full max-h-full flex-col">
          {/* Logo Area - 64px tall */}
          <div className="h-16 flex items-center px-4 border-b-[0.5px] border-border">
            {!collapsed && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <img
                    src="/cropped-clarusto-logitics-e1756811318321-85x85 .png"
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-serif text-[15px] font-medium text-foreground">CRM</span>
              </div>
            )}
            {collapsed && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 mx-auto">
                <img
                  src="/cropped-clarusto-logitics-e1756811318321-85x85 .png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-4 space-y-6">
            {menuSections.map((section) => (
              <div key={section.label}>
                {!collapsed && (
                  <p className="px-3 mb-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {section.label}
                  </p>
                )}
                <div className="space-y-1">
                  {section.items.map((item: any) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(item.href + '/');

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-lg h-9 px-3 text-[14px] font-medium transition-all duration-150',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
                        )}
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1">{item.label}</span>
                            {item.badge > 0 && (
                              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom Section */}
          <div className="border-t-[0.5px] border-border p-3 space-y-2">
            {!collapsed && (
              <div className="flex items-center gap-3 px-2 py-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-[12px] font-medium">
                    {profile?.full_name ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">
                    {isLoading ? 'Loading...' : (profile?.full_name || profile?.email || 'User')}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {profile?.role ? `${profile.role}` : (profile?.email || '')}
                  </p>
                </div>
              </div>
            )}
            
            <Button
              variant="ghost"
              size={collapsed ? 'icon' : 'default'}
              className={cn(
                'w-full justify-start gap-3 text-muted-foreground hover:text-foreground',
                collapsed && 'justify-center px-0'
              )}
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && <span className="text-[14px]">Sign Out</span>}
            </Button>

            {/* Collapse Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-8"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}