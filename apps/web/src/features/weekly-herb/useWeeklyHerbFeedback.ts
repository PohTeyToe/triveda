/**
 * useWeeklyHerbFeedback -- mutation hook for weekly herb feedback.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';

interface HerbFeedbackInput {
  herb_id: string;
  feedback_type: 'tried' | 'helpful' | 'not_for_me' | 'remind_next_week';
}

export function useWeeklyHerbFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: HerbFeedbackInput) =>
      apiFetch<{ success: boolean }>('/weekly-herb/feedback', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-herb'] });
    },
  });
}
