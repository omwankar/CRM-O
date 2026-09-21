'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Follow-ups module removed from the UI — send old bookmarks to the dashboard. */
export default function FollowUpsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);
  return <p className="p-6 text-sm text-muted-foreground">Redirecting…</p>;
}
