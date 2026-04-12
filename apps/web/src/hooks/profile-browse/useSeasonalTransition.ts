import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';
import type { SeasonalTransition } from '../../lib/types';

export const SEASONAL_KEY = ['seasonal-transition'] as const;

export function useSeasonalTransition() {
  return useQuery<SeasonalTransition>({
    queryKey: [...SEASONAL_KEY],
    queryFn: () => apiFetch<SeasonalTransition>('/seasonal-transition'),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useAcknowledgeTransition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { from_ritu: string; to_ritu: string }) =>
      apiFetch('/seasonal-transition/acknowledge', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SEASONAL_KEY] });
    },
  });
}
