/**
 * useDemoDay -- demo day counter with direction tracking for card
 * transition animations. Only active when VITE_ENABLE_DEMO_MODE is true.
 */

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

type DemoDayState = {
  day: number;
  direction: 'forward' | 'backward';
};

export type UseDemoDayReturn = {
  day: number;
  direction: 'forward' | 'backward';
  advance: () => Promise<void>;
  rewind: () => Promise<void>;
  jumpTo: (targetDay: number) => Promise<void>;
  reset: () => Promise<void>;
  isDemo: boolean;
};

const IS_DEMO = import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';

export function useDemoDay(apiUrl?: string, authToken?: string): UseDemoDayReturn {
  const [state, setState] = useState<DemoDayState>({ day: 1, direction: 'forward' });

  const callApi = useCallback(
    async (endpoint: string, body: Record<string, unknown>) => {
      if (!apiUrl) return;
      try {
        const res = await fetch(`${apiUrl}/${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
      } catch {
        toast.error('Could not update demo state');
        throw new Error('Demo state update failed');
      }
    },
    [apiUrl, authToken],
  );

  const advance = useCallback(async () => {
    if (!IS_DEMO) return;
    const prev = state.day;
    if (prev >= 30) return;
    const next = prev + 1;
    setState({ day: next, direction: 'forward' });
    try {
      await callApi('demo-state/advance', { direction: 'forward' });
    } catch {
      setState({ day: prev, direction: 'forward' });
    }
  }, [state.day, callApi]);

  const rewind = useCallback(async () => {
    if (!IS_DEMO) return;
    const prev = state.day;
    if (prev <= 1) return;
    const next = prev - 1;
    setState({ day: next, direction: 'backward' });
    try {
      await callApi('demo-state/advance', { direction: 'backward' });
    } catch {
      setState({ day: prev, direction: 'backward' });
    }
  }, [state.day, callApi]);

  const jumpTo = useCallback(
    async (targetDay: number) => {
      if (!IS_DEMO) return;
      const clamped = Math.max(1, Math.min(30, targetDay));
      const prev = state.day;
      const dir = clamped > prev ? 'forward' : 'backward';
      setState({ day: clamped, direction: dir });
      try {
        await callApi('demo-state/advance', { target_day: clamped });
      } catch {
        setState({ day: prev, direction: dir });
      }
    },
    [state.day, callApi],
  );

  const reset = useCallback(async () => {
    if (!IS_DEMO) return;
    const prev = state.day;
    setState({ day: 1, direction: 'backward' });
    try {
      await callApi('demo-state/reset', {});
    } catch {
      setState({ day: prev, direction: 'backward' });
    }
  }, [state.day, callApi]);

  return {
    day: state.day,
    direction: state.direction,
    advance,
    rewind,
    jumpTo,
    reset,
    isDemo: IS_DEMO,
  };
}
