/**
 * Test utilities for rendering components with all providers.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type RenderResult, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import type { ConstitutionProfile } from '../lib/query-options';

interface RenderOptions {
  queryClient?: QueryClient;
  profile?: ConstitutionProfile | null;
}

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderOptions = {},
): RenderResult & { queryClient: QueryClient } {
  const queryClient = options.queryClient ?? createTestQueryClient();

  if (options.profile !== undefined) {
    queryClient.setQueryData(['constitution', 'profile'], options.profile);
  }

  function Wrapper({ children }: { children: ReactElement }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  const result = render(ui, { wrapper: Wrapper as unknown as React.ComponentType });

  return { ...result, queryClient };
}
