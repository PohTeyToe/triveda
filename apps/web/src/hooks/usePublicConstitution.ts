/**
 * Hook for fetching a public constitution by ID.
 *
 * Uses the public metadata endpoint (no auth required).
 */

import { useQuery } from '@tanstack/react-query';

interface ConstitutionMetaResponse {
  id: string;
  summary: string;
  traditions: {
    ayurveda: string;
    tcm: string;
    naturopathy: string;
  };
}

function getBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
}

export function usePublicConstitution(id: string) {
  return useQuery<ConstitutionMetaResponse>({
    queryKey: ['constitution', 'public', id],
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/v1/constitution/${id}/meta`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('NOT_FOUND');
        }
        throw new Error(`Failed to fetch constitution: ${res.status}`);
      }
      return res.json();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
