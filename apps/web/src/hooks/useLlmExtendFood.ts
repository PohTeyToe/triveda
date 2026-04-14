/**
 * useLlmExtendFood -- hook that consumes the LLM-extend-food SSE endpoint.
 *
 * The hook exposes a state machine for the panel UI:
 *   idle      -> no active request
 *   streaming -> SSE in-flight, progress events updating
 *   complete  -> final food received, ready to render
 *   error     -> stream terminated with an error event
 *
 * Call `trigger(query)` to start a request. Call `cancel()` to abort.
 * `retry()` resets to idle and retriggers with the last query.
 */

import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiBaseUrl } from '../lib/api-client';
import type { BrowseFood } from '../lib/types';

export type LlmExtendStatus = 'idle' | 'streaming' | 'complete' | 'error';

export interface LlmExtendProgress {
  stage: string;
  percent: number;
}

export interface LlmExtendError {
  message: string;
  closestMatchId?: string;
}

export interface UseLlmExtendFoodReturn {
  status: LlmExtendStatus;
  progress: LlmExtendProgress | null;
  generatedFood: BrowseFood | null;
  error: LlmExtendError | null;
  query: string;
  trigger: (query: string) => void;
  cancel: () => void;
  retry: () => void;
  reset: () => void;
}

export function useLlmExtendFood(): UseLlmExtendFoodReturn {
  const [status, setStatus] = useState<LlmExtendStatus>('idle');
  const [progress, setProgress] = useState<LlmExtendProgress | null>(null);
  const [generatedFood, setGeneratedFood] = useState<BrowseFood | null>(null);
  const [error, setError] = useState<LlmExtendError | null>(null);
  const [query, setQuery] = useState<string>('');

  const controllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const reset = useCallback(() => {
    cancel();
    setStatus('idle');
    setProgress(null);
    setGeneratedFood(null);
    setError(null);
  }, [cancel]);

  const trigger = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;

      // Abort any in-flight request
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setQuery(trimmed);
      setStatus('streaming');
      setProgress({ stage: 'ayurveda', percent: 0 });
      setGeneratedFood(null);
      setError(null);

      const url = `${getApiBaseUrl()}/api/v1/llm/extend-food/${encodeURIComponent(trimmed)}`;

      fetchEventSource(url, {
        method: 'POST',
        headers: { Accept: 'text/event-stream' },
        signal: controller.signal,
        openWhenHidden: true,

        onmessage(ev) {
          switch (ev.event) {
            case 'progress': {
              try {
                const data = JSON.parse(ev.data) as LlmExtendProgress;
                setProgress(data);
              } catch {
                // ignore malformed
              }
              return;
            }
            case 'complete': {
              try {
                const data = JSON.parse(ev.data) as { food: BrowseFood };
                setGeneratedFood(data.food);
                setStatus('complete');
                // Insert into React Query cache so detail/list can pick it up
                queryClient.setQueryData(['foods', data.food.id], data.food);
              } catch {
                setError({ message: 'Failed to parse generated food.' });
                setStatus('error');
              }
              return;
            }
            case 'error': {
              try {
                const data = JSON.parse(ev.data) as {
                  message: string;
                  closest_match_id?: string;
                };
                setError({
                  message: data.message,
                  closestMatchId: data.closest_match_id,
                });
              } catch {
                setError({ message: 'Unknown error' });
              }
              setStatus('error');
              return;
            }
            case 'done': {
              controller.abort();
              return;
            }
          }
        },

        onerror(err) {
          // Don't let fetch-event-source retry forever
          if (controller.signal.aborted) throw err;
          setError({
            message: err instanceof Error ? err.message : 'Stream failed',
          });
          setStatus('error');
          throw err;
        },

        onclose() {
          // If we closed without ever hitting 'complete' or 'error', mark error
          setStatus((prev) => (prev === 'streaming' ? 'error' : prev));
        },
      }).catch(() => {
        // Errors are already surfaced via onerror
      });
    },
    [queryClient],
  );

  const retry = useCallback(() => {
    if (!query) return;
    reset();
    // Trigger on next tick so state settles
    queueMicrotask(() => trigger(query));
  }, [query, reset, trigger]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  return {
    status,
    progress,
    generatedFood,
    error,
    query,
    trigger,
    cancel,
    retry,
    reset,
  };
}
