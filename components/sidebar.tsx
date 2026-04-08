'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Alerts', href: '/dashboard/alerts', icon: Bell },
  { label: 'Clock In/Out', href: '/dashboard/clock', icon: Clock3 },
  { label: 'Calendar', href: '/dashboard/calendar', icon: CalendarDays },
  { label: 'Certifications', href: '/dashboard/certifications', icon: Award },
  { label: 'Memberships', href: '/dashboard/memberships', icon: Users },
  { label: 'Partnerships', href: '/dashboard/partnerships', icon: Briefcase },
  { label: 'Insurance', href: '/dashboard/insurance', icon: Shield },
  { label: 'Vendors', href: '/dashboard/vendors', icon: Package },
  { label: 'Buyers', href: '/dashboard/buyers', icon: ShoppingCart },
  { label: 'Documents', href: '/dashboard/documents', icon: FileText },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // If user navigates while the mobile sidebar is open, ensure the overlay
  // doesn't remain on top and block clicks.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    const { signOut } = await import('@/lib/auth');
    await signOut();
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 md:hidden rounded-lg border border-border/70 bg-card p-2 shadow-sm"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full w-72 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">

          {/* HEADER */}
          <div className="border-b border-sidebar-border px-5 py-5">
            <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-sidebar-accent shadow-sm">
              <img
                src="/cropped-clarusto-logitics-e1756811318321-85x85 .png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex flex-col leading-tight">
              <h1 className="text-sm font-semibold text-sidebar-foreground">
                CRM Portal
              </h1>
              <span className="text-xs text-sidebar-foreground/70">
                Management System
              </span>
            </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {menuItems.map((item) => {
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
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                      : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-colors',
                      isActive
                        ? 'text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground'
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-sidebar-border p-3">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
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