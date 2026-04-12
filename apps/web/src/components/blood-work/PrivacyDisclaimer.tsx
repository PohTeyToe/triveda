/**
 * PrivacyDisclaimer -- visible summary with expandable full privacy terms.
 * Keyboard accessible with aria-expanded state.
 */

import { useState } from 'react';

export function PrivacyDisclaimer() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg bg-dark-surface/30 dark:bg-dark-surface/30 border border-dark-border/20 dark:border-dark-border/20 px-4 py-3">
      <p className="text-sm text-light/60 dark:text-light/60">
        Your lab data is private to your account and never shared with other users or third parties.
      </p>

      <button
        type="button"
        className="text-xs text-teal-400 hover:text-teal-300 mt-2 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded"
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        tabIndex={0}
        aria-expanded={expanded}
        aria-controls="privacy-detail-panel"
      >
        {expanded ? 'Hide privacy terms' : 'Read full privacy terms'}
      </button>

      {expanded && (
        <div
          id="privacy-detail-panel"
          className="mt-3 space-y-2 text-xs text-light/50 dark:text-light/50"
        >
          <ul className="list-disc list-inside space-y-1.5">
            <li>Data is stored in an isolated database with row-level security</li>
            <li>Only you can access your uploaded files and extracted results</li>
            <li>Blood work data is used solely to personalize your food recommendations</li>
            <li>No data is sold, shared, or used for advertising</li>
            <li>You can delete your data at any time from the history screen</li>
          </ul>
        </div>
      )}
    </div>
  );
}
