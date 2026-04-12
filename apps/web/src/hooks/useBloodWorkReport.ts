/**
 * useBloodWorkReport -- TanStack Query hook for fetching a full report.
 *
 * Single fetch on mount (no polling). Returns the report with all
 * biomarkers and tradition context attached.
 */

import { useQuery } from '@tanstack/react-query';
import type { BloodWorkReport } from '../lib/types';

function getBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
}

export function useBloodWorkReport(reportId: string) {
  return useQuery<BloodWorkReport>({
    queryKey: ['blood-work-report', reportId],
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/api/v1/blood-work/report/${reportId}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch report: ${res.status}`);
      }
      return res.json() as Promise<BloodWorkReport>;
    },
    enabled: !!reportId,
  });
}
