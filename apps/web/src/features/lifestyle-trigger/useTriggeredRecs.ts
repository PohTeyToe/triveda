/**
 * useTriggeredRecs -- TanStack Query hook for triggered lifestyle recommendations.
 */

import { useQuery } from '@tanstack/react-query';
import type { ActiveTrigger } from '@triveda/shared';
import { apiFetch } from '../../lib/api-client';

export interface TriggeredRecsResponse {
  triggers: ActiveTrigger[];
  credits: Array<{
    featureId: string;
    featureName: string;
    active: boolean;
    contribution?: string;
  }>;
}

export function useTriggeredRecs() {
  return useQuery<TriggeredRecsResponse>({
    queryKey: ['triggered-recs'],
    queryFn: () => apiFetch<TriggeredRecsResponse>('/triggered-recs'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
