import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBanner, getErrorMessage } from '../../components/onboarding/ErrorBanner';

describe('ErrorBanner', () => {
  it('renders error message', () => {
    render(<ErrorBanner message="Could not reach the server." onRetry={() => {}} />);
    expect(screen.getByText(/could not reach the server/i)).toBeInTheDocument();
  });

  it('renders retry button', () => {
    render(<ErrorBanner message="Error" onRetry={() => {}} />);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('clicking retry calls onRetry callback', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorBanner message="Error" onRetry={onRetry} />);
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('has role="alert"', () => {
    render(<ErrorBanner message="Error" onRetry={() => {}} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('banner has error styling', () => {
    render(<ErrorBanner message="Error" onRetry={() => {}} />);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('bg-red');
  });
});

describe('getErrorMessage', () => {
  it('returns network error message for fetch failure', () => {
    const msg = getErrorMessage(new Error('Failed to fetch'));
    expect(msg).toContain('Could not reach the server');
  });

  it('returns server error message for 500', () => {
    const msg = getErrorMessage(new Error('500'));
    expect(msg).toContain('Something went wrong on our end');
  });

  it('returns default for null error', () => {
    const msg = getErrorMessage(null);
    expect(msg).toBe('Something went wrong.');
  });
});
