'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/lib/api/users';
import { supabase } from '@/lib/auth';

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

  return {
    user: userData,
    profile: profileData,
    role: profileData?.role,
    isLoading: userLoading || profileLoading,
  };
}
