import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { Profile } from '../../lib/types';

export const PROFILE_KEY = ['profile'] as const;

export function useProfile() {
  return useQuery<Profile>({
    queryKey: [...PROFILE_KEY],
    queryFn: () => apiFetch<Profile>('/profile'),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: true,
    retry: 3,
  });
}
