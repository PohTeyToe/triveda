/**
 * CreditChip -- single feature chip with Floating UI tooltip.
 * Shows active (teal) or dormant (muted) styling.
 * Tooltip appears on hover, focus, and tap (mobile).
 */

import {
  FloatingPortal,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { useState } from 'react';

// ---------------------------------------------------------------------------
// Tooltip templates
// ---------------------------------------------------------------------------

const ACTIVE_TOOLTIPS: Record<string, string> = {
  'dosha-analysis': 'Your constitution shaped this pick',
  'rasa-mapping': 'Taste profile influenced this recommendation',
  'virya-vipaka': 'Thermal qualities guided reasoning',
  'guna-matching': 'Quality matching contributed',
  'seasonal-ritu': 'Adjusted for seasonal needs',
  'weather-adaptation': "Adapted to today's weather",
  'five-element': 'Your element profile influenced this',
  'organ-clock': 'Timed for your energy window',
  'thermal-nature': 'Thermal nature considered',
  'tcm-flavor': 'TCM flavor analysis applied',
  'evidence-grading': 'Evidence quality assessed',
  'pubmed-citations': 'Research citations reviewed',
  'honest-gaps': 'Gaps in evidence acknowledged',
  'convergence-detection': 'Traditions were compared on this',
  'contradiction-engine': 'Flagged tradition disagreements',
  'blood-work-integration': 'Informed by your blood work',
  'face-scan': 'Face scan data contributed',
  'check-in-patterns': 'Daily check-in patterns applied',
  'food-feedback-loop': 'Your food feedback shaped this',
  'anti-repetition': 'Varied from recent suggestions',
  'progressive-profiling': 'Your growing profile contributed',
  'dietary-restrictions': 'Dietary restrictions applied',
};

const DORMANT_TOOLTIPS: Record<string, string> = {
  'dosha-analysis': 'Complete your profile to activate',
  'rasa-mapping': 'Will contribute with more data',
  'virya-vipaka': 'Will contribute with more data',
  'guna-matching': 'Will contribute with more data',
  'seasonal-ritu': 'Will contribute with more data',
  'weather-adaptation': 'Will contribute with more data',
  'five-element': 'Complete your profile to activate',
  'organ-clock': 'Will contribute with more data',
  'thermal-nature': 'Will contribute with more data',
  'tcm-flavor': 'Will contribute with more data',
  'evidence-grading': 'Will contribute with more data',
  'pubmed-citations': 'Will contribute with more data',
  'honest-gaps': 'Will contribute with more data',
  'convergence-detection': 'Will contribute with more data',
  'contradiction-engine': 'Will contribute with more data',
  'blood-work-integration': 'Upload blood work to activate',
  'face-scan': 'Complete a face scan to activate',
  'check-in-patterns': 'Log check-ins to activate',
  'food-feedback-loop': 'More feedback needed to activate',
  'anti-repetition': 'Will contribute with more data',
  'progressive-profiling': 'Will contribute with more data',
  'dietary-restrictions': 'Set your dietary restrictions to activate',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type CreditChipProps = {
  featureId: string;
  featureName: string;
  active: boolean;
  contribution?: string;
  dormantReason?: string;
  tabIndex: number;
  onFocus: () => void;
};

export function CreditChip({
  featureId,
  featureName,
  active,
  contribution,
  dormantReason,
  tabIndex,
  onFocus,
}: CreditChipProps) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isTooltipOpen,
    onOpenChange: setIsTooltipOpen,
    placement: 'top',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  });

  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    click,
    dismiss,
    role,
  ]);

  const tooltipText = active
    ? contribution || ACTIVE_TOOLTIPS[featureId] || 'Active for this recommendation'
    : dormantReason || DORMANT_TOOLTIPS[featureId] || 'Will contribute with more data';

  const tooltipId = `${featureId}-tooltip`;

  return (
    <>
      <button
        ref={refs.setReference}
        type="button"
        tabIndex={tabIndex}
        onFocus={onFocus}
        aria-describedby={tooltipId}
        className={`
          rounded-full px-3 py-1.5 min-h-[44px]
          text-xs font-medium whitespace-nowrap
          border transition-colors
          focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-dark
          ${
            active
              ? 'bg-teal/10 dark:bg-teal/20 text-teal-700 dark:text-teal border-teal/20 dark:border-teal/30'
              : 'bg-light-muted dark:bg-dark-elevated text-neutral-400 dark:text-neutral-500 border-neutral-200 dark:border-dark-border'
          }
        `}
        {...getReferenceProps()}
      >
        {featureName}
      </button>

      {isTooltipOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            id={tooltipId}
            role="tooltip"
            style={floatingStyles}
            className="
              bg-white dark:bg-dark-elevated
              text-neutral-800 dark:text-neutral-200
              text-xs rounded-lg px-3 py-2
              shadow-lg dark:shadow-md
              max-w-xs z-50
            "
            {...getFloatingProps()}
          >
            {tooltipText}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
