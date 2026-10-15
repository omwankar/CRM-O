import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardMain } from '@/components/DashboardMain';
import { Notifications } from '@/components/notifications';
import { WarmApi } from '@/components/WarmApi';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-svh min-h-0 w-screen overflow-hidden bg-background">
      <WarmApi />
      <DashboardSidebar />

      {/* Main area — min-h-0 lets flex child shrink so only <main> scrolls (no body “double scroll”) */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top navbar */}
        <div className="flex h-14 shrink-0 items-center justify-end border-b border-blue-100 bg-white/80 px-6 backdrop-blur">
          <Notifications />
        </div>

        {/* Page content: single scroll container, overscroll contained for stable edges */}
        <DashboardMain>{children}</DashboardMain>
      </div>
    </div>
  );
}
