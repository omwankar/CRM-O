'use client';

import type { ReactNode } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

/**
 * Permission gates for the UI. Backend enforcement is the security boundary
 * (see `backend/src/middleware/requireRole.ts`); these components just hide
 * controls that would 403 anyway so plain users don't see dead buttons.
 *
 *   <CanWrite>
 *     <Button onClick={...}>Add</Button>
 *   </CanWrite>
 *
 *   <CanManageUsers fallback={<AccessDenied />}>
 *     <UsersTable />
 *   </CanManageUsers>
 */

interface CanProps {
  children: ReactNode;
  /** Rendered instead of `children` when the check fails. */
  fallback?: ReactNode;
}

/** manager / super_admin. Hides write actions on shared modules. */
export function CanWrite({ children, fallback = null }: CanProps) {
  const { canWrite, isLoading } = useCurrentUser();
  if (isLoading) return null;
  return <>{canWrite ? children : fallback}</>;
}

/** super_admin only. Used to gate user-management screens. */
export function CanManageUsers({ children, fallback = null }: CanProps) {
  const { canManageUsers, isLoading } = useCurrentUser();
  if (isLoading) return null;
  return <>{canManageUsers ? children : fallback}</>;
}
