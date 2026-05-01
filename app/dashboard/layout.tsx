import { Sidebar } from '@/components/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar — fixed on the left, never overlaps content */}
      <Sidebar />

      {/* Main area — takes remaining width, scrolls independently */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top navbar */}
        <div className="w-full h-14 flex items-center justify-end px-6 border-b border-border bg-card shrink-0" />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-[1280px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}