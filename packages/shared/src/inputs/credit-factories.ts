/**
 * CreditSource factory functions for the three input pathways.
 *
 * Each factory produces a CreditSource entry for the 22-feature credit row
 * on the daily card. Always emits an entry (even with weight 0) so the
 * credit row shows all active sources.
 */

import { CHIP_PAIRS } from '../check-in-mapping/index.js';
import type { CreditSource } from '../credits.js';
import { getCuisineLabel } from '../cuisines/index.js';
import type { DailyCheckInAnswer, FaceScanReading } from './types.js';

// ---------------------------------------------------------------------------
// Face scan credit
// ---------------------------------------------------------------------------

export function createFaceScanCredit(_reading: FaceScanReading, weight: number): CreditSource {
  return {
    featureId: 'face-scan',
    featureName: 'Face Scan',
    active: weight > 0.01,
    contribution:
      weight > 0.01
        ? 'Face scan (simulated) -- influenced today'
        : 'Face scan (simulated) -- considered, not significant',
  };
}

// ---------------------------------------------------------------------------
// Check-in summary builder (not exported)
// ---------------------------------------------------------------------------

function buildCheckInSummary(selections: Record<string, 'left' | 'right' | null>): string {
  const labels: string[] = [];

  for (const pair of CHIP_PAIRS) {
    const selection = selections[pair.id];
    if (selection === 'left') {
      labels.push(pair.left_label.toLowerCase());
    } else if (selection === 'right') {
      labels.push(pair.right_label.toLowerCase());
    }
  }

  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0] ?? '';
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  if (labels.length <= 3) {
    const last = labels.pop() ?? '';
    return `${labels.join(', ')}, and ${last}`;
  }

  // More than 3: truncate
  return `${labels.slice(0, 3).join(', ')}, and more`;
}

// ---------------------------------------------------------------------------
// Daily check-in credit
// ---------------------------------------------------------------------------

export function createDailyCheckInCredit(
  answer: DailyCheckInAnswer | null,
  weight: number,
): CreditSource {
  if (!answer || answer.dismissed) {
    return {
      featureId: 'check-in-patterns',
      featureName: 'Check-In Patterns',
      active: false,
      contribution: 'No check-in today',
    };
  }

  const summary = buildCheckInSummary(answer.selections);

  return {
    featureId: 'check-in-patterns',
    featureName: 'Check-In Patterns',
    active: weight > 0,
    contribution: summary ? `You said ${summary} today` : 'Check-in recorded, no strong signals',
  };
}

// ---------------------------------------------------------------------------
// Cultural match credit
// ---------------------------------------------------------------------------

export function createCulturalMatchCredit(cuisineCodes: string[], weight: number): CreditSource {
  if (weight <= 0 || cuisineCodes.length === 0) {
    return {
      featureId: 'face-scan', // cultural match does not have its own featureId in the 22 -- uses face-scan or a future slot
      featureName: 'Cultural Match',
      active: false,
      contribution: 'Cultural match -- no matching foods today',
    };
  }

  const labels = cuisineCodes.map(getCuisineLabel).join(', ');
  return {
    featureId: 'face-scan',
    featureName: 'Cultural Match',
    active: true,
    contribution: `Cultural match (${labels}) -- nudged ranking`,
  };
}
