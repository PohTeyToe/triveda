/**
 * useBiomarkerCorrection -- TanStack Query mutation for manual biomarker corrections.
 *
 * Sends a PATCH to update value and unit. Invalidates the report query on success.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CorrectionInput {
  biomarkerId: string;
  value: number;
  unit: string;
  reportId: string;
}

function getBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
}

export function useBiomarkerCorrection() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, CorrectionInput>({
    mutationFn: async ({ biomarkerId, value, unit }) => {
      const res = await fetch(`${getBaseUrl()}/api/v1/blood-work/biomarker/${biomarkerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, unit }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Correction failed: ${res.status}`);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['blood-work-report', variables.reportId],
      });
    },
  });
}
