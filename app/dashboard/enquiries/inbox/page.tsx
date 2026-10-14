'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InquiryInboxRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/operations');
  }, [router]);
  return <p className="p-6 text-sm text-muted-foreground">Opening the operations pipeline…</p>;
}
