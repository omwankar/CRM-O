'use client';

import { useEffect } from 'react';

/** Fire a cheap health check so a sleeping Render instance starts warming immediately. */
export function WarmApi() {
  useEffect(() => {
    const raw = process.env.NEXT_PUBLIC_API_URL || '';
    if (!raw) return;
    const base = raw.replace(/\/+$/, '').replace(/\/api$/, '');
    fetch(`${base}/api/health`).catch(() => {});
  }, []);
  return null;
}
