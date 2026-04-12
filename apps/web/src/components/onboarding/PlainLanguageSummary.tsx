/**
 * Plain-language constitutional summary.
 *
 * Warm, second-person voice. No tradition names in the summary text
 * (enforced by backend template, verified by frontend tests).
 */

import { Card } from '../layout/Card';

interface PlainLanguageSummaryProps {
  summary: string;
}

export function PlainLanguageSummary({ summary }: PlainLanguageSummaryProps) {
  return (
    <Card variant="elevated" className="border-t-2 border-teal/30 p-4 md:p-6">
      <h2 className="font-heading text-2xl md:text-3xl font-bold text-dark dark:text-light mb-3">
        Your Constitution
      </h2>
      <p className="font-body text-base text-gray-700 dark:text-gray-300 leading-relaxed">
        {summary}
      </p>
    </Card>
  );
}
