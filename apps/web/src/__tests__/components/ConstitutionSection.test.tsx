import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ConstitutionSection } from '../../components/onboarding/ConstitutionSection';

describe('ConstitutionSection', () => {
  it('renders expanded when defaultExpanded=true', () => {
    render(
      <ConstitutionSection
        title="Your Constitution"
        content="Test content"
        defaultExpanded={true}
        sectionId="section-test"
      />,
    );
    const toggle = screen.getByRole('button', { name: /your constitution/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders collapsed when defaultExpanded=false', () => {
    render(
      <ConstitutionSection
        title="Your Energy Today"
        content="TCM content"
        defaultExpanded={false}
        sectionId="section-tcm"
      />,
    );
    const toggle = screen.getByRole('button', { name: /your energy today/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('clicking collapsed section expands it', async () => {
    const user = userEvent.setup();
    render(
      <ConstitutionSection
        title="The Evidence"
        content="Naturopathy content"
        defaultExpanded={false}
        sectionId="section-nat"
      />,
    );
    const toggle = screen.getByRole('button', { name: /the evidence/i });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('clicking expanded section collapses it', async () => {
    const user = userEvent.setup();
    render(
      <ConstitutionSection
        title="Your Constitution"
        content="Content here"
        defaultExpanded={true}
        sectionId="section-ayu"
      />,
    );
    const toggle = screen.getByRole('button', { name: /your constitution/i });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('aria-controls links toggle to content region', () => {
    render(
      <ConstitutionSection
        title="Test"
        content="Content"
        defaultExpanded={true}
        sectionId="section-tcm"
      />,
    );
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAttribute('aria-controls', 'section-tcm');
    expect(document.getElementById('section-tcm')).toBeInTheDocument();
  });

  it('keyboard Enter toggles section', async () => {
    const user = userEvent.setup();
    render(
      <ConstitutionSection
        title="Test"
        content="Content"
        defaultExpanded={false}
        sectionId="section-key"
      />,
    );
    const toggle = screen.getByRole('button');
    toggle.focus();
    await user.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('keyboard Space toggles section', async () => {
    const user = userEvent.setup();
    render(
      <ConstitutionSection
        title="Test"
        content="Content"
        defaultExpanded={false}
        sectionId="section-space"
      />,
    );
    const toggle = screen.getByRole('button');
    toggle.focus();
    await user.keyboard(' ');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('collapsed titles use plain English, no tradition names', () => {
    render(
      <>
        <ConstitutionSection
          title="Your Constitution"
          content="Ayurveda content"
          defaultExpanded={false}
          sectionId="s-1"
        />
        <ConstitutionSection
          title="Your Energy Today"
          content="TCM content"
          defaultExpanded={false}
          sectionId="s-2"
        />
        <ConstitutionSection
          title="The Evidence"
          content="Naturopathy content"
          defaultExpanded={false}
          sectionId="s-3"
        />
      </>,
    );
    // Check button labels
    const buttons = screen.getAllByRole('button');
    const labels = buttons.map((b) => b.textContent);
    expect(labels.join(' ')).not.toMatch(/Ayurveda|TCM|Naturopathy/i);
  });
});
