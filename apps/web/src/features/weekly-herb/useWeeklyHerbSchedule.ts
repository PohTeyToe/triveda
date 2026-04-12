/**
 * useWeeklyHerbSchedule -- mutation hook for changing delivery day.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';

export function useWeeklyHerbSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { day: number }) =>
      apiFetch<{ success: boolean; day: number }>('/weekly-herb/schedule', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-herb'] });
    },
  });
}
