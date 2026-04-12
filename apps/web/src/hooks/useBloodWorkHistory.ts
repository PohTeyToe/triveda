/**
 * useBloodWorkHistory -- TanStack Query hook for listing all blood work reports.
 *
 * Returns reports sorted by upload date (most recent first).
 * Invalidated by upload and delete mutations.
 */

import { useQuery } from '@tanstack/react-query';
import type { BloodWorkReportSummary } from '../lib/types';

function getBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
}

export function useBloodWorkHistory() {
  return useQuery<BloodWorkReportSummary[]>({
    queryKey: ['blood-work-history'],
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/v1/blood-work/history/list`);
      if (!res.ok) {
        throw new Error(`Failed to fetch history: ${res.status}`);
      }
      const data = (await res.json()) as { reports: BloodWorkReportSummary[] };
      return data.reports;
    },
  });
}
