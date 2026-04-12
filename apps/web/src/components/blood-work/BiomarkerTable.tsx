/**
 * BiomarkerTable -- renders all extracted biomarkers in a semantic table.
 * Each row is expandable to show three-tradition context.
 */

import type { BloodWorkBiomarker } from '../../lib/types';
import { BiomarkerRow } from './BiomarkerRow';

interface BiomarkerTableProps {
  biomarkers: BloodWorkBiomarker[];
}

export function BiomarkerTable({ biomarkers }: BiomarkerTableProps) {
  if (biomarkers.length === 0) {
    return (
      <p className="text-sm text-light/40 dark:text-light/40 text-center py-8">
        No biomarkers extracted from this report.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-dark-border/30 dark:border-dark-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-dark-border/30 dark:border-dark-border bg-dark-surface/50 dark:bg-dark-surface/50">
            <th className="px-3 py-2 text-left text-xs font-medium text-light/50 dark:text-light/50 uppercase tracking-wider">
              Biomarker
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-light/50 dark:text-light/50 uppercase tracking-wider">
              Value
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-light/50 dark:text-light/50 uppercase tracking-wider">
              Range
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-light/50 dark:text-light/50 uppercase tracking-wider">
              Flag
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-light/50 dark:text-light/50 uppercase tracking-wider">
              Confidence
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-border/20 dark:divide-dark-border/20">
          {biomarkers.map((bm) => (
            <BiomarkerRow key={bm.id} biomarker={bm} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
