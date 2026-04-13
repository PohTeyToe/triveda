/**
 * Constitution Card screen -- the payoff for Quick Start.
 *
 * Spring-reveal constitution card with hero type, 2x2 insight grid,
 * expandable tradition sections, and optional CTA from quickstart.
 */

import { Link, useSearch } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useConstitutionProfile } from '../../hooks/useConstitutionProfile';
import {
  constitutionRevealProps,
  sectionExpandProps,
  staggerContainer,
  staggerItem,
} from '../../lib/animations';
import { ShareButton } from '../share/ShareButton';
import { ConstitutionSkeleton } from './ConstitutionSkeleton';
import { ErrorBanner, getErrorMessage } from './ErrorBanner';

/** Derive the dominant dosha label from ratios */
function getDominantType(ratios: { vata: number; pitta: number; kapha: number }): string {
  const sorted = Object.entries(ratios).sort(([, a], [, b]) => b - a);
  const first = sorted[0];
  const second = sorted[1];
  if (!first || !second) return 'Balanced';
  // If top two are within 10%, show dual type
  if (first[1] - second[1] < 0.1) {
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    return `${capitalize(first[0])}-${capitalize(second[0])}`;
  }
  return first[0].charAt(0).toUpperCase() + first[0].slice(1);
}

/** Derive a balance score (0-100) from dosha ratios */
function getBalanceScore(ratios: { vata: number; pitta: number; kapha: number }): number {
  const vals = Object.values(ratios);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  // Lower deviation = more balanced
  const deviation = Math.sqrt(vals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / vals.length);
  // Normalize: 0 deviation = 100 score, max theoretical deviation (~0.47) = 0
  return Math.round(Math.max(0, Math.min(100, (1 - deviation / 0.47) * 100)));
}

/** Map element type to a season affinity */
function getSeasonAffinity(elementType: string | null): string {
  if (!elementType) return 'Transitional';
  const map: Record<string, string> = {
    air: 'Autumn',
    fire: 'Summer',
    water: 'Winter',
    earth: 'Late Winter',
    ether: 'Spring',
    wood: 'Spring',
    metal: 'Autumn',
  };
  return map[elementType.toLowerCase()] ?? 'Transitional';
}

/** Map dominant dosha to an energy pattern */
function getEnergyPattern(ratios: { vata: number; pitta: number; kapha: number }): string {
  const sorted = Object.entries(ratios).sort(([, a], [, b]) => b - a);
  const dominant = sorted[0]?.[0] ?? 'vata';
  const patterns: Record<string, string> = {
    vata: 'Variable',
    pitta: 'Intense',
    kapha: 'Steady',
  };
  return patterns[dominant] ?? 'Balanced';
}

const TRADITION_SECTIONS = [
  { key: 'ayurveda' as const, title: 'Your Constitution' },
  { key: 'tcm' as const, title: 'Your Energy Today' },
  { key: 'naturopathy' as const, title: 'The Evidence' },
] as const;

export function ConstitutionCardScreen() {
  const { user } = useAuth();
  const { profile, isLoading, isError, error } = useConstitutionProfile();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announceRef = useRef<HTMLDivElement>(null);
  const [expandedSection, setExpandedSection] = useState<string>('ayurveda');

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

  const dominantType = getDominantType(profile.dosha_ratios);
  const balanceScore = getBalanceScore(profile.dosha_ratios);
  const seasonAffinity = getSeasonAffinity(profile.element_type);
  const energyPattern = getEnergyPattern(profile.dosha_ratios);

  const insightBlocks = [
    { label: 'Dominant Type', value: dominantType },
    { label: 'Balance Score', value: `${balanceScore}%` },
    { label: 'Season Affinity', value: seasonAffinity },
    { label: 'Energy Pattern', value: energyPattern },
  ];

  const toggleSection = (key: string) => {
    setExpandedSection((prev) => (prev === key ? '' : key));
  };

  return (
    <motion.div {...constitutionRevealProps} className="space-y-5 max-w-lg mx-auto px-4 py-6">
      {/* Visually hidden heading for focus management */}
      <h1 ref={headingRef} tabIndex={-1} className="sr-only">
        Your Constitution Profile
      </h1>

      {/* Screen reader announcement */}
      <div ref={announceRef} aria-live="assertive" className="sr-only">
        Your constitution profile is ready
      </div>

      {/* Hero section */}
      <div className="text-center space-y-3">
        <h2 className="font-heading text-3xl font-bold text-teal tracking-tight">{dominantType}</h2>
        <p className="font-body text-base text-cream/70 leading-relaxed">
          {profile.plain_language_summary}
        </p>
      </div>

      {/* Share button */}
      {user && (
        <div className="flex justify-end">
          <ShareButton constitutionId={user.id} summary={profile.plain_language_summary} />
        </div>
      )}

      {/* 2x2 insight grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3"
      >
        {insightBlocks.map((block) => (
          <motion.div
            key={block.label}
            variants={staggerItem}
            className="bg-dark-elevated rounded-2xl p-4"
          >
            <p className="font-body text-xs uppercase tracking-wider text-cream/40 mb-1">
              {block.label}
            </p>
            <p className="font-heading text-lg font-bold text-cream">{block.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Three tradition sections -- accordion */}
      <div className="space-y-3">
        {TRADITION_SECTIONS.map((section) => {
          const isExpanded = expandedSection === section.key;
          const content = profile.tradition_sections[section.key];

          return (
            <div key={section.key} className="bg-dark-elevated rounded-2xl">
              <button
                type="button"
                onClick={() => toggleSection(section.key)}
                aria-expanded={isExpanded}
                aria-controls={`section-${section.key}-content`}
                id={`section-${section.key}-trigger`}
                className="w-full flex items-center justify-between p-4 min-h-[48px]
                  focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2
                  focus-visible:ring-offset-dark rounded-2xl"
              >
                <span className="font-body text-sm font-medium text-cream/80">{section.title}</span>
                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <ChevronDown className="w-5 h-5 text-cream/40" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.section
                    id={`section-${section.key}-content`}
                    aria-labelledby={`section-${section.key}-trigger`}
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={sectionExpandProps.transition}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4">
                      <p className="font-body text-sm text-cream/60 leading-relaxed">{content}</p>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* First-time CTA */}
      {fromQuickStart && (
        <div className="pt-2">
          <Link
            to="/"
            className="block w-full text-center bg-teal text-dark rounded-2xl min-h-[48px]
              font-body font-medium py-3
              hover:bg-teal/90 transition-colors
              focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2
              focus-visible:ring-offset-dark"
          >
            See your first recommendation
          </Link>
        </div>
      )}
    </motion.div>
  );
}
