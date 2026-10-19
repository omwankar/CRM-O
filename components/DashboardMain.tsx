'use client';

import { usePathname } from 'next/navigation';

export function DashboardMain({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path.startsWith('/dashboard/operations')) {
    return <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>;
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain scroll-smooth p-6">
      <div className="mx-auto w-full max-w-[1440px] min-h-0 pb-4">{children}</div>
    </main>
  );
}
