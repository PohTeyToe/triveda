/**
 * useTriggerDismiss -- mutation hook for dismissing a trigger.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DismissalType, TriggerType } from '@triveda/shared';
import { apiFetch } from '../../lib/api-client';

interface DismissInput {
  trigger_type: TriggerType;
  dismissal_type: DismissalType;
}

export function useTriggerDismiss() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DismissInput) =>
      apiFetch<{ success: boolean }>('/triggered-recs/dismiss', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['triggered-recs'] });
    },
  });
}
