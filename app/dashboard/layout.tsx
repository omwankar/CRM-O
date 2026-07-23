import { Suspense } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Notifications } from '@/components/notifications';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-svh min-h-0 w-screen overflow-hidden bg-background">
      {/* Sidebar uses useSearchParams — must be under Suspense for static prerender */}
      <Suspense fallback={<aside className="hidden w-64 shrink-0 border-r bg-card md:block" />}>
        <Sidebar />
      </Suspense>

      {/* Main area — min-h-0 lets flex child shrink so only <main> scrolls (no body “double scroll”) */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top navbar */}
        <div className="flex h-14 shrink-0 items-center justify-end border-b border-border bg-card px-6">
          <Notifications />
        </div>

        {/* Page content: single scroll container, overscroll contained for stable edges */}
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain scroll-smooth p-6">
          <div className="mx-auto w-full max-w-[1280px] min-h-0 pb-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}