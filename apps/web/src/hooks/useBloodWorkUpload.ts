/**
 * useBloodWorkUpload -- TanStack Query mutation for uploading lab reports.
 *
 * Posts a file to POST /api/v1/blood-work and returns the jobId + reportId.
 * Invalidates the blood work history query on success.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UploadResult {
  jobId: string;
  reportId: string;
}

function getBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
}

export function useBloodWorkUpload() {
  const queryClient = useQueryClient();

  return useMutation<UploadResult, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${getBaseUrl()}/api/v1/blood-work`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Upload failed: ${res.status}`);
      }

      return res.json() as Promise<UploadResult>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blood-work-history'] });
    },
  });
}
