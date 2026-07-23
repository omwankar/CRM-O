'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EditTaskRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/tasks');
  }, [router]);
  return <p className="p-6 text-sm text-muted-foreground">Redirecting…</p>;
}
