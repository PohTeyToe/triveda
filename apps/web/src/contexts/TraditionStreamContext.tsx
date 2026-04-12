/**
 * TraditionStreamContext -- owns the SSE connection to GET /daily-food
 * and distributes per-tradition streaming state via React context.
 *
 * Uses @microsoft/fetch-event-source because native EventSource cannot
 * set custom Authorization headers for Supabase JWT auth.
 */

import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, createContext, useEffect, useMemo, useReducer, useRef } from 'react';

// ---------------------------------------------------------------------------
// State types
// ---------------------------------------------------------------------------

export type TraditionStreamStatus = 'idle' | 'streaming' | 'complete' | 'error';

export type TraditionState = {
  text: string;
  state: TraditionStreamStatus;
};

export type TraditionStreamState = {
  ayurveda: TraditionState;
  tcm: TraditionState;
  naturopathy: TraditionState;
  synthesis: TraditionState;
};

type TraditionKey = keyof TraditionStreamState;

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type Action =
  | { type: 'TRADITION_PARTIAL'; tradition: TraditionKey; text: string }
  | { type: 'TRADITION_COMPLETE'; tradition: TraditionKey; text: string }
  | { type: 'TRADITION_ERROR'; tradition: TraditionKey }
  | { type: 'RESET_ALL' }
  | {
      type: 'SET_ALL_COMPLETE';
      data: Record<TraditionKey, string>;
    };

const INITIAL_TRADITION: TraditionState = { text: '', state: 'idle' };

const initialState: TraditionStreamState = {
  ayurveda: { ...INITIAL_TRADITION },
  tcm: { ...INITIAL_TRADITION },
  naturopathy: { ...INITIAL_TRADITION },
  synthesis: { ...INITIAL_TRADITION },
};

function reducer(state: TraditionStreamState, action: Action): TraditionStreamState {
  switch (action.type) {
    case 'TRADITION_PARTIAL':
      return {
        ...state,
        [action.tradition]: {
          text: state[action.tradition].text + action.text,
          state: 'streaming' as const,
        },
      };
    case 'TRADITION_COMPLETE':
      return {
        ...state,
        [action.tradition]: { text: action.text, state: 'complete' as const },
      };
    case 'TRADITION_ERROR':
      return {
        ...state,
        [action.tradition]: {
          text: state[action.tradition].text,
          state: 'error' as const,
        },
      };
    case 'RESET_ALL':
      return { ...initialState };
    case 'SET_ALL_COMPLETE':
      return {
        ayurveda: { text: action.data.ayurveda, state: 'complete' },
        tcm: { text: action.data.tcm, state: 'complete' },
        naturopathy: { text: action.data.naturopathy, state: 'complete' },
        synthesis: { text: action.data.synthesis, state: 'complete' },
      };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// FoodSelected data shape (from SSE food_selected event)
// ---------------------------------------------------------------------------

export type FoodProperties = {
  thermal?: string;
  taste?: string;
  season?: string;
};

export type DailyFoodData = {
  food: { id: string; name: string; properties?: FoodProperties };
  rationale: string;
  convergence: {
    state: 'converged' | 'diverged' | 'partial';
    dimensions: { name: string; agrees: boolean }[];
    partialLabel?: string;
  };
  credits: import('@triveda/shared').CreditSource[];
  profilingQuestion?: { id: string; text: string; options: string[] };
  seasonLabel: string;
  weatherSummary: string;
  date: string;
  suggestionId: string;
  feedback?: 'tried' | 'rejected' | null;
};

// ---------------------------------------------------------------------------
// Context value
// ---------------------------------------------------------------------------

type PromiseKit<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

function createPromiseKit<T>(): PromiseKit<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export type TraditionStreamContextValue = {
  traditions: TraditionStreamState;
  foodSelectedPromise: Promise<DailyFoodData>;
};

export const TraditionStreamContext = createContext<TraditionStreamContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

type TraditionStreamProviderProps = {
  children: ReactNode;
  userId?: string;
  demoDay?: number;
  authToken?: string;
  apiUrl?: string;
};

/**
 * Map SSE event names to tradition keys.
 * Events arrive as e.g. "tradition_ayurveda_partial" or "tradition_tcm_complete".
 */
function parseTraditionEvent(
  eventName: string,
): { tradition: TraditionKey; type: 'partial' | 'complete' } | null {
  const match = eventName.match(/^tradition_(ayurveda|tcm|naturopathy)_(partial|complete)$/);
  if (!match) return null;
  return {
    tradition: match[1] as TraditionKey,
    type: match[2] as 'partial' | 'complete',
  };
}

export function TraditionStreamProvider({
  children,
  userId,
  demoDay = 1,
  authToken,
  apiUrl,
}: TraditionStreamProviderProps) {
  const [traditions, dispatch] = useReducer(reducer, initialState);
  const queryClient = useQueryClient();
  const promiseRef = useRef<PromiseKit<DailyFoodData>>(createPromiseKit<DailyFoodData>());
  const resolvedRef = useRef(false);

  // Reset promise and traditions on day change (inline during render)
  const prevDayRef = useRef(demoDay);
  if (prevDayRef.current !== demoDay) {
    prevDayRef.current = demoDay;
    dispatch({ type: 'RESET_ALL' });
    resolvedRef.current = false;
    promiseRef.current = createPromiseKit<DailyFoodData>();
  }

  // SSE connection
  useEffect(() => {
    // Check cache first
    const cached = queryClient.getQueryData<DailyFoodData>(['daily-food', userId, demoDay]);
    if (cached) {
      if (!resolvedRef.current) {
        resolvedRef.current = true;
        promiseRef.current.resolve(cached);
      }
      return;
    }

    if (!apiUrl) return;

    const controller = new AbortController();
    const today = new Date().toISOString().slice(0, 10);

    const url = new URL(`${apiUrl}/daily-food`);
    url.searchParams.set('date', today);
    if (demoDay > 1) {
      url.searchParams.set('demo_day', String(demoDay));
    }

    fetchEventSource(url.toString(), {
      method: 'GET',
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        Accept: 'text/event-stream',
      },
      signal: controller.signal,

      onmessage(ev) {
        const eventName = ev.event;

        if (eventName === 'food_selected') {
          try {
            const data = JSON.parse(ev.data) as DailyFoodData;
            if (!resolvedRef.current) {
              resolvedRef.current = true;
              promiseRef.current.resolve(data);
            }
          } catch {
            // Parse error -- let error boundary handle
          }
          return;
        }

        if (eventName === 'synthesis_complete') {
          try {
            const text = typeof ev.data === 'string' ? ev.data : '';
            dispatch({ type: 'TRADITION_COMPLETE', tradition: 'synthesis', text });
          } catch {
            // ignore
          }
          return;
        }

        if (eventName === 'done') {
          controller.abort();
          return;
        }

        // Tradition streaming events
        const parsed = parseTraditionEvent(eventName);
        if (parsed) {
          if (parsed.type === 'partial') {
            dispatch({
              type: 'TRADITION_PARTIAL',
              tradition: parsed.tradition,
              text: ev.data,
            });
          } else {
            dispatch({
              type: 'TRADITION_COMPLETE',
              tradition: parsed.tradition,
              text: ev.data,
            });
          }
        }
      },

      onerror(err) {
        // Dispatch errors for any tradition currently streaming
        const keys: TraditionKey[] = ['ayurveda', 'tcm', 'naturopathy', 'synthesis'];
        for (const key of keys) {
          dispatch({ type: 'TRADITION_ERROR', tradition: key });
        }

        if (!resolvedRef.current) {
          resolvedRef.current = true;
          promiseRef.current.reject(err);
        }

        // Throw to stop retries
        throw err;
      },

      openWhenHidden: true,
    }).catch(() => {
      // Connection closed or errored -- handled above
    });

    return () => {
      controller.abort();
    };
  }, [userId, demoDay, authToken, apiUrl, queryClient]);

  const value = useMemo<TraditionStreamContextValue>(
    () => ({
      traditions,
      foodSelectedPromise: promiseRef.current.promise,
    }),
    [traditions],
  );

  return (
    <TraditionStreamContext.Provider value={value}>{children}</TraditionStreamContext.Provider>
  );
}
