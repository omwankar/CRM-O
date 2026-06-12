'use client';

import { useEffect, useState } from 'react';

/** True only after the component has mounted in the browser (safe for locale/time APIs). */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
}
