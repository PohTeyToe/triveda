/**
 * useFoodFeedback -- TanStack Query mutation for POST /food-feedback
 * with optimistic update and rollback.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { DailyFoodData } from '../contexts/TraditionStreamContext';

type FeedbackPayload = {
  suggestion_id: string;
  response: 'tried' | 'rejected';
};

type FeedbackOptions = {
  userId?: string;
  demoDay?: number;
  apiUrl?: string;
  authToken?: string;
};

export function useFoodFeedback({ userId, demoDay = 1, apiUrl, authToken }: FeedbackOptions) {
  const queryClient = useQueryClient();
  const queryKey = ['daily-food', userId, demoDay];

  return useMutation({
    mutationFn: async (variables: FeedbackPayload) => {
      if (!apiUrl) throw new Error('No API URL configured');

      const res = await fetch(`${apiUrl}/food-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(variables),
      });

      if (!res.ok) {
        throw new Error(`Feedback submission failed: ${res.status}`);
      }

      return res.json();
    },

    onMutate: async (variables: FeedbackPayload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<DailyFoodData>(queryKey);

      queryClient.setQueryData<DailyFoodData>(queryKey, (old) => {
        if (!old) return old;
        return { ...old, feedback: variables.response };
      });

      return { previous };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error('Could not save feedback. Try again?');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
