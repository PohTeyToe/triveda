/**
 * Derived-state hook for progressive profiling.
 *
 * Built on top of useConstitutionProfile. Used by DailyProfilingQuestion
 * to decide whether to render a question.
 *
 * Exposes answeredCount and totalQuestions for split 09's Profile screen,
 * but NO component in this split renders them as visible text.
 */

import type { Question } from '../lib/query-options';
import { useConstitutionProfile } from './useConstitutionProfile';

const TOTAL_QUESTIONS = 18;

export interface ProfilingState {
  nextQuestion: Question | null;
  isComplete: boolean;
  answeredCount: number;
  totalQuestions: number;
  isLoading: boolean;
}

export function useProgressiveProfilingState(): ProfilingState {
  const { profile, isLoading, nextUnansweredQuestion } = useConstitutionProfile();

  const answeredCount = profile?.answer_count ?? 0;
  const isComplete = answeredCount >= TOTAL_QUESTIONS;

  return {
    nextQuestion: nextUnansweredQuestion,
    isComplete,
    answeredCount,
    totalQuestions: TOTAL_QUESTIONS,
    isLoading,
  };
}
