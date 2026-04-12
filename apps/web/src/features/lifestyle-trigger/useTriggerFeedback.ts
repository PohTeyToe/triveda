/**
 * useTriggerFeedback -- mutation hook for trigger feedback.
 */

import { useMutation } from '@tanstack/react-query';
import type { TriggerType } from '@triveda/shared';
import { apiFetch } from '../../lib/api-client';

interface TriggerFeedbackInput {
  trigger_type: TriggerType;
  trigger_instance_id: string;
  feedback_type: 'helped' | 'tried' | 'dismissed';
  feedback_detail?: string;
}

export function useTriggerFeedback() {
  return useMutation({
    mutationFn: (input: TriggerFeedbackInput) =>
      apiFetch<{ success: boolean }>('/triggered-recs/feedback', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}
