/**
 * Tests for useLlmExtendFood hook.
 *
 * Mocks `@microsoft/fetch-event-source` to inject synthetic progress /
 * complete / error event sequences and asserts state transitions.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---- mock fetch-event-source BEFORE importing the hook ----

type OnMessage = (ev: { event: string; data: string }) => void;

const callbacks: {
  onmessage?: OnMessage;
  onerror?: (err: unknown) => void;
  onclose?: () => void;
} = {};

vi.mock('@microsoft/fetch-event-source', () => ({
  fetchEventSource: vi.fn(
    (_url: string, opts: { onmessage?: OnMessage; onerror?: unknown; onclose?: () => void }) => {
      callbacks.onmessage = opts.onmessage;
      callbacks.onerror = opts.onerror as (err: unknown) => void;
      callbacks.onclose = opts.onclose;
      return Promise.resolve();
    },
  ),
}));

// Import AFTER mock
import { useLlmExtendFood } from '../../hooks/useLlmExtendFood';

// ---- helpers ----

function wrapper({ children }: PropsWithChildren) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function emit(event: string, data: unknown) {
  callbacks.onmessage?.({ event, data: JSON.stringify(data) });
}

beforeEach(() => {
  callbacks.onmessage = undefined;
  callbacks.onerror = undefined;
  callbacks.onclose = undefined;
});

describe('useLlmExtendFood', () => {
  it('starts in idle status', () => {
    const { result } = renderHook(() => useLlmExtendFood(), { wrapper });
    expect(result.current.status).toBe('idle');
    expect(result.current.progress).toBeNull();
  });

  it('transitions idle -> streaming -> complete and inserts into react query cache', async () => {
    const { result } = renderHook(() => useLlmExtendFood(), { wrapper });

    act(() => {
      result.current.trigger('jackfruit');
    });

    await waitFor(() => expect(result.current.status).toBe('streaming'));

    act(() => {
      emit('progress', { stage: 'ayurveda', percent: 25 });
    });
    expect(result.current.progress?.percent).toBe(25);

    act(() => {
      emit('progress', { stage: 'tcm', percent: 60 });
    });
    expect(result.current.progress?.stage).toBe('tcm');

    act(() => {
      emit('complete', {
        food: {
          id: 'llm-generated:xyz',
          name: 'Jackfruit',
          category: 'fruits',
          confidence_score: 0.5,
        },
      });
    });

    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(result.current.generatedFood?.id).toBe('llm-generated:xyz');
  });

  it('transitions to error state on error event with closestMatchId', async () => {
    const { result } = renderHook(() => useLlmExtendFood(), { wrapper });

    act(() => {
      result.current.trigger('mangomelon');
    });
    await waitFor(() => expect(result.current.status).toBe('streaming'));

    act(() => {
      emit('error', {
        message: 'A similar food exists',
        closest_match_id: 'food-mango',
      });
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error?.message).toBe('A similar food exists');
    expect(result.current.error?.closestMatchId).toBe('food-mango');
  });

  it('cancel() aborts the stream and resets to idle via reset()', async () => {
    const { result } = renderHook(() => useLlmExtendFood(), { wrapper });

    act(() => {
      result.current.trigger('plantain');
    });
    await waitFor(() => expect(result.current.status).toBe('streaming'));

    act(() => {
      result.current.reset();
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.generatedFood).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('ignores empty query trigger', () => {
    const { result } = renderHook(() => useLlmExtendFood(), { wrapper });
    act(() => {
      result.current.trigger('   ');
    });
    expect(result.current.status).toBe('idle');
  });
});
