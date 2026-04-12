import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConstitutionSkeleton } from '../../components/onboarding/ConstitutionSkeleton';

describe('ConstitutionSkeleton', () => {
  it('renders three section placeholders', () => {
    const { container } = render(<ConstitutionSkeleton />);
    // Three section title shimmers inside the sections card
    const sectionDivs = container.querySelectorAll('.border-b');
    expect(sectionDivs.length).toBe(3);
  });

  it('has animate-pulse class', () => {
    const { container } = render(<ConstitutionSkeleton />);
    const pulseEl = container.querySelector('.animate-pulse');
    expect(pulseEl).toBeInTheDocument();
  });

  it('has aria-busy attribute', () => {
    const { container } = render(<ConstitutionSkeleton />);
    const busyEl = container.querySelector('[aria-busy="true"]');
    expect(busyEl).toBeInTheDocument();
  });
});
