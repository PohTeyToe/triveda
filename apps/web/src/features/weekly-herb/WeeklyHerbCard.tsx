/**
 * WeeklyHerbCard -- full weekly herb recommendation display.
 *
 * Shows herb name, evidence tier badge, tradition accordion sections,
 * feedback buttons, and credit row.
 */

import { useState } from 'react';
import { Card } from '../../components/layout/Card';
import { WeeklyHerbFeedback } from './WeeklyHerbFeedback';
import { useWeeklyHerb } from './useWeeklyHerb';

const _EVIDENCE_BADGE_COLORS: Record<string, string> = {
  high: 'bg-green-600 text-white',
  moderate: 'bg-teal-600 text-white',
  traditional: 'bg-amber-700 text-white',
  speculative: 'bg-gray-600 text-white',
};

const _EVIDENCE_LABELS: Record<string, string> = {
  high: 'High evidence',
  moderate: 'Moderate evidence',
  traditional: 'Traditional use',
  speculative: 'Speculative',
};

export function WeeklyHerbCard() {
  const { data, isLoading } = useWeeklyHerb();
  const [expandedSection, setExpandedSection] = useState<string | null>('ayurveda');

  if (isLoading) {
    return (
      <Card variant="elevated" className="animate-pulse">
        <div className="h-32 bg-gray-200 dark:bg-dark-border rounded-lg" />
        <div className="mt-3 h-6 w-2/3 bg-gray-200 dark:bg-dark-border rounded" />
        <div className="mt-2 h-4 w-full bg-gray-200 dark:bg-dark-border rounded" />
      </Card>
    );
  }

  if (!data || !data.herb) {
    const message =
      data?.reason === 'profile_incomplete'
        ? 'Complete your profile to receive weekly herb recommendations.'
        : data?.reason === 'no_eligible_herbs'
          ? 'No herbs match your current profile. Try adjusting your dietary restrictions.'
          : data?.nextDeliveryDate
            ? `Your next herb recommendation arrives on ${data.nextDeliveryDate}.`
            : 'No herb recommendation available.';

    return (
      <Card variant="elevated">
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      </Card>
    );
  }

  const { herb, traditionNotes, traditionNotesPending } = data;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const sections = [
    { key: 'ayurveda', label: 'Ayurvedic Profile' },
    { key: 'tcm', label: 'TCM Profile' },
    { key: 'naturopathy', label: 'Naturopathic Evidence' },
  ] as const;

  return (
    <Card variant="elevated" className="space-y-3">
      {/* Herb name */}
      <h2 className="text-xl font-serif font-semibold text-gray-900 dark:text-gray-100">
        {herb.name}
      </h2>

      {/* Description */}
      {herb.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{herb.description}</p>
      )}

      {/* Three-tradition accordion */}
      <div className="space-y-1">
        {sections.map(({ key, label }) => (
          <div
            key={key}
            className="border border-dark-border/30 dark:border-dark-border rounded-lg overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleSection(key)}
              aria-expanded={expandedSection === key}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface"
            >
              <span>{label}</span>
              <span className="text-xs">{expandedSection === key ? '\u25B2' : '\u25BC'}</span>
            </button>
            {expandedSection === key && (
              <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border-t border-dark-border/20">
                {traditionNotesPending ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-3 w-full bg-gray-200 dark:bg-dark-border rounded" />
                    <div className="h-3 w-3/4 bg-gray-200 dark:bg-dark-border rounded" />
                  </div>
                ) : traditionNotes ? (
                  <p>{traditionNotes[key]}</p>
                ) : (
                  <p className="italic">No tradition notes available.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Feedback */}
      <WeeklyHerbFeedback herbId={herb.id} />
    </Card>
  );
}
