'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy new-task route — redirect into unified board. */
export default function NewTaskRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/tasks');
  }, [router]);
  return <p className="p-6 text-sm text-muted-foreground">Redirecting…</p>;
}
