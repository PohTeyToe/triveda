/**
 * useDailyFood -- TanStack Query hook wrapping the daily food recommendation.
 *
 * Uses a regular JSON fetch to GET /daily-food. The SSE streaming approach
 * was removed because mock LLM mode makes streaming unnecessary, and the
 * SSE event shape didn't match the DailyFoodData type, causing crashes.
 */

import { useQuery } from '@tanstack/react-query';
import type { DailyFoodData } from '../contexts/TraditionStreamContext';
import { apiFetch } from '../lib/api-client';

/**
 * Raw shape returned by GET /api/v1/daily-food (JSON mode).
 * Different from DailyFoodData -- we map below.
 */
interface DailyFoodApiResponse {
  food: {
    id: string;
    name: string;
    totalScore: number | null;
    breakdown: Record<string, unknown>;
  };
  three_tradition_output: {
    ayurveda: Record<string, unknown>;
    tcm: Record<string, unknown>;
    naturopathy: Record<string, unknown>;
    synthesis: {
      twoSentenceRationale?: string;
      convergenceFraming?: string;
      [key: string]: unknown;
    };
  };
  convergence_report: {
    score: number;
    agreementCount: number;
    interestingDivergence: boolean;
    dimensions: Record<string, { agrees: boolean; detail: string }>;
  };
  optional_profiling_question: string | null;
  credits: Array<{
    featureId: string;
    featureName: string;
    active: boolean;
    contribution: string;
  }>;
}

function mapApiResponse(raw: DailyFoodApiResponse, date: string): DailyFoodData {
  // Map convergence_report dimensions to the array format DailyFoodData expects
  const dimensions = Object.entries(raw.convergence_report.dimensions).map(([name, dim]) => ({
    name,
    agrees: dim.agrees,
  }));

  const allAgree = dimensions.every((d) => d.agrees);
  const noneAgree = dimensions.every((d) => !d.agrees);
  const convergenceState: 'converged' | 'diverged' | 'partial' = allAgree
    ? 'converged'
    : noneAgree
      ? 'diverged'
      : 'partial';

  // Rationale: prefer synthesis twoSentenceRationale, fall back to constitutional
  const rationale =
    raw.three_tradition_output?.synthesis?.twoSentenceRationale ??
    (raw.food.breakdown as Record<string, { rationale?: string }>)?.constitutional?.rationale ??
    'Selected based on your constitutional profile.';

  return {
    food: {
      id: raw.food.id,
      name: raw.food.name,
    },
    rationale,
    convergence: {
      state: convergenceState,
      dimensions,
    },
    credits: raw.credits,
    seasonLabel: 'Late spring',
    weatherSummary: 'Clear skies',
    date,
    suggestionId: raw.food.id,
    feedback: null,
  };
}

export function useDailyFood(userId?: string, demoDay = 1) {
  const today = new Date().toISOString().slice(0, 10);

  return useQuery<DailyFoodData>({
    queryKey: ['daily-food', userId, demoDay],
    queryFn: async () => {
      const raw = await apiFetch<DailyFoodApiResponse>(
        `/daily-food?date=${today}${demoDay > 1 ? `&demo_day=${demoDay}` : ''}`,
      );
      return mapApiResponse(raw, today);
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    gcTime: 10 * 60_000,
    enabled: !!userId,
  });
}
