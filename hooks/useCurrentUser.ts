'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/lib/api/users';
import { supabase } from '@/lib/auth';

export type AppRole = 'super_admin' | 'manager' | 'user';

/**
 * Single source of truth for "what can the current user do?" on the frontend.
 *
 * Permission helpers map to the server-side role middleware:
 *   - canWrite        -> sharedWriteGuard (manager or super_admin)
 *   - canManageUsers  -> requireSuperAdmin
 *   - canEditTask(t)  -> taskWriteGuard
 */
export function useCurrentUser() {
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['currentProfile'],
    queryFn: getCurrentUser,
    enabled: !!userData,
  });

  // Normalise legacy roles in case the migration hasn't run yet. Anything
  // outside the new set falls back to the safest interpretation ('user').
  const rawRole = profileData?.role as string | undefined;
  const role: AppRole =
    rawRole === 'super_admin'
      ? 'super_admin'
      : rawRole === 'manager' || rawRole === 'admin'
        ? 'manager'
        : 'user';

  const isSuperAdmin = role === 'super_admin';
  const isManager = role === 'manager';
  const isUser = role === 'user';

  /** Can mutate shared modules (projects, vendors, calendar, …). */
  const canWrite = isSuperAdmin || isManager;

  /** Can invite / deactivate / change roles of other users. */
  const canManageUsers = isSuperAdmin;

  /**
   * Plain users can only modify a task they're allocated to. Pass the task
   * row (or just the relevant id fields) to check ownership.
   */
  const canEditTask = (task?: {
    assigned_person_id?: string | null;
    supervisor_id?: string | null;
    created_by?: string | null;
  }) => {
    if (canWrite) return true;
    if (!task || !userData?.id) return false;
    return (
      task.assigned_person_id === userData.id ||
      task.supervisor_id === userData.id ||
      task.created_by === userData.id
    );
  };

  return {
    user: userData,
    profile: profileData,
    role,
    isSuperAdmin,
    isManager,
    isUser,
    canWrite,
    canManageUsers,
    canEditTask,
    isLoading: userLoading || profileLoading,
  };
}
