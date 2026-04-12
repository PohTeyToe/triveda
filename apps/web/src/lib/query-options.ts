/**
 * Shared TanStack Query options for constitution profile.
 *
 * Used by route beforeLoad guards and useConstitutionProfile hook.
 * The profile query treats a 404 as null (new user), not an error.
 */

import { queryOptions } from '@tanstack/react-query';

export interface ConstitutionProfile {
  dosha_ratios: { vata: number; pitta: number; kapha: number };
  element_type: string | null;
  plain_language_summary: string;
  tradition_sections: {
    ayurveda: string;
    tcm: string;
    naturopathy: string;
  };
  completeness: number;
  answer_count: number;
}

export interface Question {
  id: string;
  text: string;
  type: 'single_choice' | 'multi_choice' | 'scale';
  options: Array<{ value: string; label: string }>;
  description?: string;
}

async function fetchProfile(): Promise<ConstitutionProfile | null> {
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/v1/constitution/profile`, {
    credentials: 'include',
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(`Failed to fetch profile: ${res.status}`);
  }

  const data = await res.json();
  return data.profile ?? null;
}

export const profileQueryOptions = queryOptions({
  queryKey: ['constitution', 'profile'] as const,
  queryFn: fetchProfile,
  staleTime: 1000 * 60 * 5, // 5 minutes
  retry: 2,
});

export async function fetchQuestions(set: 'seed' | 'next' = 'seed'): Promise<Question[]> {
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/v1/constitution/questions?set=${set}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch questions: ${res.status}`);
  }

  const data = await res.json();
  return data.questions ?? [];
}

export const seedQuestionsQueryOptions = queryOptions({
  queryKey: ['constitution', 'questions', 'seed'] as const,
  queryFn: () => fetchQuestions('seed'),
  staleTime: 1000 * 60 * 30, // 30 minutes -- seed questions rarely change
});

export const nextQuestionQueryOptions = queryOptions({
  queryKey: ['constitution', 'questions', 'next'] as const,
  queryFn: () => fetchQuestions('next'),
  staleTime: 1000 * 60 * 1, // 1 minute -- changes after each answer
});
