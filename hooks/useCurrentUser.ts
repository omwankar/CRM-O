'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/lib/api/users';
import { supabase } from '@/lib/auth';

export type AppRole = 'super_admin' | 'manager' | 'user';

const PROFILE_CACHE_KEY = 'crm.currentProfile';

function readCachedProfile() {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = sessionStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function writeCachedProfile(profile: unknown) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore quota */
  }
}

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
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: profileData } = useQuery({
    queryKey: ['currentProfile'],
    queryFn: async () => {
      const profile = await getCurrentUser();
      writeCachedProfile(profile);
      return profile;
    },
    enabled: !!userData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: () => readCachedProfile(),
  });

  // Normalise legacy roles. Until profile loads, leave role undefined so menus
  // don't SSR as "user" then flip to super_admin on the client.
  const rawRole = profileData?.role as string | undefined;
  const role: AppRole | undefined = !profileData
    ? undefined
    : rawRole === 'super_admin'
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

  // Cached profile is enough to paint the sidebar; don't block the whole shell
  const isLoading = userLoading && !userData && !profileData;

  return {
    user: userData,
    profile: profileData,
    role: role ?? 'user',
    isSuperAdmin,
    isManager,
    isUser,
    canWrite,
    canManageUsers,
    canEditTask,
    isLoading,
  };
}
