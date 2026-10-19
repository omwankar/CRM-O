'use client';

export function DashboardMain({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain scroll-smooth p-6">
      <div className="mx-auto w-full max-w-[1440px] min-h-0 pb-4">{children}</div>
    </main>
  );
}
