/**
 * useBloodWorkJob -- TanStack Query hook for polling job status.
 *
 * Polls at 2-second intervals while status is pending or processing.
 * Stops polling on terminal states (complete, failed).
 */

import { useQuery } from '@tanstack/react-query';
import type { BloodWorkJobStatus } from '../lib/types';

function getBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
}

export function useBloodWorkJob(jobId: string | null) {
  return useQuery<BloodWorkJobStatus>({
    queryKey: ['blood-work-job', jobId],
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/v1/blood-work/${jobId}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch job status: ${res.status}`);
      }
      return res.json() as Promise<BloodWorkJobStatus>;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'pending' || status === 'processing') return 2000;
      return false;
    },
  });
}
