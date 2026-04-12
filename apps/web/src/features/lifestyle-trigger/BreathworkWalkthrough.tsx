/**
 * BreathworkWalkthrough -- expandable breathwork step-by-step guide.
 *
 * Rendered inside the stress trigger card when "Learn more" is tapped.
 */

import type { BreathworkTemplate } from '@triveda/shared';

interface BreathworkWalkthroughProps {
  template: BreathworkTemplate;
  isExpanded: boolean;
  onToggle: () => void;
}

export function BreathworkWalkthrough({
  template,
  isExpanded,
  onToggle,
}: BreathworkWalkthroughProps) {
  const headingId = `breathwork-heading-${template.id}`;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="text-sm text-teal-600 dark:text-teal-400 underline-offset-2 hover:underline"
      >
        {isExpanded ? 'Hide details' : 'Learn more'}
      </button>

      {isExpanded && (
        <section
          aria-labelledby={headingId}
          className="mt-3 space-y-3 bg-gray-50 dark:bg-dark-surface rounded-lg p-3"
        >
          <h4 id={headingId} className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {template.name}
          </h4>

          <p className="text-xs text-gray-500 dark:text-gray-400">{template.tradition}</p>

          <p className="text-xs text-gray-600 dark:text-gray-400">
            About {template.durationMinutes} minutes
          </p>

          <ol className="list-decimal list-inside space-y-1">
            {template.steps.map((step) => (
              <li key={step} className="text-sm text-gray-700 dark:text-gray-300">
                {step}
              </li>
            ))}
          </ol>

          <p className="text-xs italic text-gray-500 dark:text-gray-400">{template.whyThisHelps}</p>
        </section>
      )}
    </div>
  );
}
