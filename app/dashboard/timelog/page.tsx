'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TimeLogRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/timesheet');
  }, [router]);
  return <p className="text-sm text-muted-foreground">Opening timesheet…</p>;
}
