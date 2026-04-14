/**
 * Tests for LlmExtendPanel.
 *
 * Focuses on state rendering (streaming / complete / error) and click
 * handlers. The SSE hook integration is tested separately in
 * useLlmExtendFood.test.ts.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { LlmExtendPanel } from '../../components/profile-browse/LlmExtendPanel';
import type { BrowseFood } from '../../lib/types';

// Ensure matchMedia exists in jsdom (desktop layout path)
beforeAll(() => {
  if (typeof window !== 'undefined' && !window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query.includes('min-width: 1024px'),
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });
  }
});

function renderPanel(overrides: Partial<React.ComponentProps<typeof LlmExtendPanel>> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    status: 'streaming' as const,
    progress: { stage: 'ayurveda', percent: 25 },
    generatedFood: null,
    error: null,
    query: 'jackfruit',
    onRetry: vi.fn(),
    onSave: vi.fn(),
    onNavigateToMatch: vi.fn(),
    isSaved: false,
    ...overrides,
  };
  const utils = render(
    <QueryClientProvider client={qc}>
      <LlmExtendPanel {...props} />
    </QueryClientProvider>,
  );
  return { ...utils, props };
}

const completeFood: BrowseFood = {
  id: 'llm-generated:abc',
  name: 'Jackfruit',
  category: 'fruits',
  rasa: ['madhura'],
  virya: 'sheeta',
  guna: ['laghu'],
  dosha_effects: { vata: -1, pitta: -1, kapha: 1 },
  thermal_nature: 'cool',
  tcm_flavor: ['sweet'],
  confidence_score: 0.5,
};

describe('LlmExtendPanel - streaming state', () => {
  it('shows generation header with query name', () => {
    renderPanel({ status: 'streaming' });
    expect(screen.getByText(/Generating jackfruit/i)).toBeInTheDocument();
  });

  it('progress bar reflects percent via aria-valuenow', () => {
    renderPanel({ status: 'streaming', progress: { stage: 'tcm', percent: 50 } });
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '50');
  });

  it('shows TCM stage label when percent is in TCM range', () => {
    renderPanel({ status: 'streaming', progress: { stage: 'tcm', percent: 50 } });
    expect(screen.getByText(/Generating TCM properties/i)).toBeInTheDocument();
  });

  it('does not render a close button while streaming', () => {
    renderPanel({ status: 'streaming' });
    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
  });
});

describe('LlmExtendPanel - complete state', () => {
  it('renders the generated food name as heading', () => {
    renderPanel({ status: 'complete', generatedFood: completeFood });
    expect(screen.getByRole('heading', { name: /Jackfruit/i })).toBeInTheDocument();
  });

  it('shows pending validation badge with amber styling', () => {
    renderPanel({ status: 'complete', generatedFood: completeFood });
    const badge = screen.getByTestId('pending-validation-badge');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/amber/);
    expect(screen.getByText(/Pending validation/i)).toBeInTheDocument();
  });

  it('renders three TraditionSection components', () => {
    renderPanel({ status: 'complete', generatedFood: completeFood });
    expect(screen.getByRole('button', { name: /Ayurveda/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /TCM/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Naturopathy/i })).toBeInTheDocument();
  });

  it('renders the save button and calls onSave when clicked', async () => {
    const onSave = vi.fn();
    renderPanel({ status: 'complete', generatedFood: completeFood, onSave });
    const user = userEvent.setup();
    const saveBtn = screen.getByRole('button', { name: /Save to my browse history/i });
    await user.click(saveBtn);
    expect(onSave).toHaveBeenCalledOnce();
  });

  it('disables save button once saved', () => {
    renderPanel({ status: 'complete', generatedFood: completeFood, isSaved: true });
    expect(screen.getByRole('button', { name: /Saved to browse history/i })).toBeDisabled();
  });

  it('close button is visible when not streaming', () => {
    renderPanel({ status: 'complete', generatedFood: completeFood });
    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });
});

describe('LlmExtendPanel - error state', () => {
  it('renders error message and try again button', async () => {
    const onRetry = vi.fn();
    renderPanel({
      status: 'error',
      error: { message: 'LLM unavailable.' },
      onRetry,
    });
    expect(screen.getByText(/Could not generate this entry/i)).toBeInTheDocument();
    expect(screen.getByText('LLM unavailable.')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders closest match link when closestMatchId is present', () => {
    renderPanel({
      status: 'error',
      error: { message: 'Match found', closestMatchId: 'food-xyz' },
    });
    expect(screen.getByRole('button', { name: /Did you mean/i })).toBeInTheDocument();
  });

  it('close button is visible in error state', () => {
    renderPanel({
      status: 'error',
      error: { message: 'Failed' },
    });
    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });
});
