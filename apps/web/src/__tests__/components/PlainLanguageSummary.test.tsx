import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlainLanguageSummary } from '../../components/onboarding/PlainLanguageSummary';
import { mockProfile } from '../fixtures';

describe('PlainLanguageSummary', () => {
  it('renders heading "Your Constitution"', () => {
    render(<PlainLanguageSummary summary="Test summary" />);
    expect(screen.getByRole('heading', { name: /your constitution/i })).toBeInTheDocument();
  });

  it('heading uses Crimson Pro font class', () => {
    render(<PlainLanguageSummary summary="Test" />);
    const heading = screen.getByRole('heading', { name: /your constitution/i });
    expect(heading.className).toContain('font-heading');
  });

  it('renders the summary text', () => {
    render(<PlainLanguageSummary summary="You run hot-cold" />);
    expect(screen.getByText(/You run hot-cold/)).toBeInTheDocument();
  });

  it('body uses DM Sans font class', () => {
    const { container } = render(<PlainLanguageSummary summary="Test" />);
    const p = container.querySelector('p');
    expect(p?.className).toContain('font-body');
  });

  it('summary text does not contain tradition names', () => {
    render(<PlainLanguageSummary summary={mockProfile.plain_language_summary} />);
    const text = screen.getByText(/You run hot-cold/).textContent ?? '';
    expect(text).not.toMatch(/Ayurveda|TCM|Naturopathy/i);
  });
});
