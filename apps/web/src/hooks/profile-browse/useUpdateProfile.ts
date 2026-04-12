import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { apiFetch } from '../../lib/api-client';
import type { Profile } from '../../lib/types';
import { PROFILE_KEY } from './useProfile';

const DEBOUNCE_MS = 500;

/**
 * Debounced profile mutation with optimistic updates.
 *
 * Rapid calls within 500ms are batched into a single PATCH request.
 * The UI updates immediately via optimistic cache writes, and rolls
 * back on failure.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const accumulatedRef = useRef<Partial<Profile>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutation = useMutation<
    Profile,
    Error,
    Partial<Profile>,
    { previousProfile: Profile | undefined }
  >({
    mutationFn: (data: Partial<Profile>) =>
      apiFetch<Profile>('/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: [...PROFILE_KEY] });
      const previousProfile = queryClient.getQueryData<Profile>([...PROFILE_KEY]);
      queryClient.setQueryData<Profile>([...PROFILE_KEY], (old) =>
        old ? { ...old, ...newData } : undefined,
      );
      return { previousProfile };
    },
    onError: (_err, _newData, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData([...PROFILE_KEY], context.previousProfile);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...PROFILE_KEY] });
      queryClient.invalidateQueries({ queryKey: ['daily-food'] });
      queryClient.invalidateQueries({ queryKey: ['seasonal-transition'] });
    },
  });

  const debouncedMutate = useCallback(
    (partialProfile: Partial<Profile>) => {
      // Accumulate changes
      accumulatedRef.current = { ...accumulatedRef.current, ...partialProfile };

      // Apply optimistic update immediately
      queryClient.setQueryData<Profile>([...PROFILE_KEY], (old) =>
        old ? { ...old, ...partialProfile } : undefined,
      );

      // Reset debounce timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        const payload = accumulatedRef.current;
        accumulatedRef.current = {};
        mutation.mutate(payload);
      }, DEBOUNCE_MS);
    },
    [queryClient, mutation],
  );

  const { mutate: _rawMutate, ...rest } = mutation;

  return {
    mutate: debouncedMutate,
    ...rest,
  };
}
