/**
 * Central data hook for the onboarding flow.
 *
 * Wraps the constitution profile query and mutations for Quick Start
 * assessment and progressive profiling answers.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreditSource } from '@triveda/shared';
import {
  type ConstitutionProfile,
  type Question,
  nextQuestionQueryOptions,
  profileQueryOptions,
} from '../lib/query-options';

interface AssessResponse {
  profile: ConstitutionProfile;
  credits: CreditSource[];
}

interface AnswerResponse {
  profile: ConstitutionProfile;
  completeness: number;
  credits: CreditSource[];
}

interface QuickStartInput {
  answers: Array<{ questionId: number; choice: string }>;
}

interface AnswerInput {
  answer: { questionId: number; choice: string };
}

export function useConstitutionProfile() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery(profileQueryOptions);
  const nextQuestionQuery = useQuery({
    ...nextQuestionQueryOptions,
    enabled: !!profileQuery.data,
  });

  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

  const submitQuickStart = useMutation<AssessResponse, Error, QuickStartInput>({
    mutationFn: async (input) => {
      const res = await fetch(`${baseUrl}/api/v1/constitution/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          (errorData as { error?: { message?: string } })?.error?.message ??
            `Assessment failed: ${res.status}`,
        );
      }
      return res.json();
    },
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    onSuccess: (data) => {
      queryClient.setQueryData(['constitution', 'profile'], data.profile);
      queryClient.setQueryData(['credits', 'onboarding'], data.credits);
      // Invalidate next question since profile changed
      queryClient.invalidateQueries({
        queryKey: ['constitution', 'questions', 'next'],
      });
    },
  });

  const submitAnswer = useMutation<AnswerResponse, Error, AnswerInput>({
    mutationFn: async (input) => {
      const res = await fetch(`${baseUrl}/api/v1/constitution/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          (errorData as { error?: { message?: string } })?.error?.message ??
            `Answer submission failed: ${res.status}`,
        );
      }
      return res.json();
    },
    retry: 1,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    onSuccess: (data) => {
      queryClient.setQueryData(['constitution', 'profile'], data.profile);
      queryClient.setQueryData(['credits', 'onboarding'], data.credits);
      queryClient.invalidateQueries({
        queryKey: ['constitution', 'questions', 'next'],
      });
    },
  });

  const nextUnansweredQuestion: Question | null = nextQuestionQuery.data?.[0] ?? null;

  return {
    profile: profileQuery.data ?? undefined,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,
    submitQuickStart,
    submitAnswer,
    nextUnansweredQuestion,
  };
}
