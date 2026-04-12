/**
 * useWeeklyHerb -- TanStack Query hook for the weekly herb recommendation.
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api-client';

export interface WeeklyHerbResponse {
  herb: {
    id: string;
    name: string;
    description: string;
  } | null;
  traditionNotes: {
    ayurveda: string;
    tcm: string;
    naturopathy: string;
  } | null;
  traditionNotesPending: boolean;
  credits: Array<{
    featureId: string;
    featureName: string;
    active: boolean;
    contribution?: string;
  }> | null;
  nextDeliveryDate: string | null;
  reason: string | null;
}

export function useWeeklyHerb() {
  return useQuery<WeeklyHerbResponse>({
    queryKey: ['weekly-herb'],
    queryFn: () => apiFetch<WeeklyHerbResponse>('/weekly-herb'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
