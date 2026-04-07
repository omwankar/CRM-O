import { Sidebar } from '@/components/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block w-72 shrink-0">
        <Sidebar />
      </div>

      <div className="md:hidden">
        <Sidebar />
      </div>

      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}