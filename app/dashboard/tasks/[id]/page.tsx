'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function TaskDetailRedirect() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  useEffect(() => {
    router.replace('/dashboard/tasks');
  }, [router, id]);
  return <p className="p-6 text-sm text-muted-foreground">Redirecting…</p>;
}
