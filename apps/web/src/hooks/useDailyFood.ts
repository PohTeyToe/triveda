/**
 * useDailyFood -- TanStack Query hook wrapping the daily food recommendation.
 *
 * The queryFn awaits the foodSelectedPromise from TraditionStreamContext,
 * which resolves when the SSE food_selected event arrives.
 */

import { useQuery } from '@tanstack/react-query';
import { useContext } from 'react';
import { type DailyFoodData, TraditionStreamContext } from '../contexts/TraditionStreamContext';

export function useDailyFood(userId?: string, demoDay = 1) {
  const ctx = useContext(TraditionStreamContext);

  return useQuery<DailyFoodData>({
    queryKey: ['daily-food', userId, demoDay],
    queryFn: () => {
      if (!ctx) {
        throw new Error('useDailyFood must be used within TraditionStreamProvider');
      }
      return ctx.foodSelectedPromise;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    gcTime: 10 * 60 * 1000,
    enabled: !!ctx,
  });
}
