'use client';

import dynamic from 'next/dynamic';

/** Client-only sidebar — role-based items (Punch Requests, HR) must not SSR or they hydrate-mismatch. */
export const DashboardSidebar = dynamic(
  () => import('@/components/sidebar').then((m) => ({ default: m.Sidebar })),
  {
    ssr: false,
    loading: () => (
      <aside
        className="hidden w-64 shrink-0 border-r border-white/10 bg-[#0f172a] md:block"
        aria-hidden
      />
    ),
  },
);
