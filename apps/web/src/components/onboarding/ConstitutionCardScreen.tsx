/**
 * Constitution Card screen -- the payoff for Quick Start.
 *
 * Shows a personalized constitutional profile with plain-language summary
 * and three expandable tradition sections.
 *
 * Collapsed section titles use plain English, no tradition names.
 * First-time CTA appears only when arriving from Quick Start (?from=quickstart).
 */

import { Link, useSearch } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useConstitutionProfile } from '../../hooks/useConstitutionProfile';
import { Card } from '../layout/Card';
import { ConstitutionSection } from './ConstitutionSection';
import { ConstitutionSkeleton } from './ConstitutionSkeleton';
import { ErrorBanner, getErrorMessage } from './ErrorBanner';
import { PlainLanguageSummary } from './PlainLanguageSummary';

export function ConstitutionCardScreen() {
  const { profile, isLoading, isError, error } = useConstitutionProfile();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announceRef = useRef<HTMLDivElement>(null);

  // Read search params
  let fromQuickStart = false;
  try {
    const search = useSearch({ strict: false }) as Record<string, unknown>;
    fromQuickStart = search?.from === 'quickstart';
  } catch {
    // Search params not available
  }

  useEffect(() => {
    if (profile && headingRef.current) {
      headingRef.current.focus();
    }
  }, [profile]);

  if (isLoading) {
    return <ConstitutionSkeleton />;
  }

  if (isError || !profile) {
    return (
      <div className="space-y-4">
        <ErrorBanner message={getErrorMessage(error)} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Visually hidden heading for focus management */}
      <h1 ref={headingRef} tabIndex={-1} className="sr-only">
        Your Constitution Profile
      </h1>

      {/* Screen reader announcement */}
      <div ref={announceRef} aria-live="assertive" className="sr-only">
        Your constitution profile is ready
      </div>

      {/* Plain language summary */}
      <PlainLanguageSummary summary={profile.plain_language_summary} />

      {/* Tradition sections */}
      <Card variant="default" className="p-4 md:p-6">
        <ConstitutionSection
          title="Your Constitution"
          content={profile.tradition_sections.ayurveda}
          defaultExpanded={true}
          sectionId="section-ayurveda"
        />
        <ConstitutionSection
          title="Your Energy Today"
          content={profile.tradition_sections.tcm}
          defaultExpanded={false}
          sectionId="section-tcm"
        />
        <ConstitutionSection
          title="The Evidence"
          content={profile.tradition_sections.naturopathy}
          defaultExpanded={false}
          sectionId="section-naturopathy"
        />
      </Card>

      {/* First-time CTA */}
      {fromQuickStart && (
        <div className="text-center pt-2">
          <Link
            to="/"
            className="inline-block px-6 py-2.5 rounded-xl font-body text-sm
              border border-teal text-teal
              hover:bg-teal/10 transition-colors
              focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
          >
            See your first recommendation
          </Link>
        </div>
      )}
    </div>
  );
}
