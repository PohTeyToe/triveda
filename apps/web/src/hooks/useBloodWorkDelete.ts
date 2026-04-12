/**
 * useBloodWorkDelete -- TanStack Query mutation for deleting a blood work report.
 *
 * Cascade deletion handles biomarkers and review queue entries.
 * Invalidates the history query on success.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

function getBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
}

export function useBloodWorkDelete() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (reportId: string) => {
      const res = await fetch(`${getBaseUrl()}/api/v1/blood-work/report/${reportId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Delete failed: ${res.status}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blood-work-history'] });
    },
  });
}
