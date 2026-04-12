/**
 * Breathwork content assets -- static templates for the stress trigger.
 *
 * Three techniques with step-by-step instructions.
 * No runtime logic, just structured content.
 */

import type { BreathworkTemplate } from './types.js';

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export const BREATHWORK_TEMPLATES: readonly BreathworkTemplate[] = [
  {
    id: 'four-seven-eight',
    name: '4-7-8 Breathing',
    tradition: 'Modern relaxation (popularized by Dr. Andrew Weil)',
    evidenceTier: 'traditional',
    steps: [
      'Sit comfortably and close your eyes.',
      'Exhale completely through your mouth with a whoosh sound.',
      'Inhale quietly through your nose for 4 counts.',
      'Hold your breath for 7 counts.',
      'Exhale completely through your mouth for 8 counts.',
      'Repeat the cycle 3 more times (4 cycles total).',
    ],
    durationMinutes: 2,
    whyThisHelps:
      'The extended exhale activates the parasympathetic nervous system, slowing heart rate and promoting calm.',
  },
  {
    id: 'nadi-shodhana',
    name: 'Nadi Shodhana (Alternate Nostril Breathing)',
    tradition: 'Pranayama (Ayurvedic breathwork)',
    evidenceTier: 'moderate',
    steps: [
      'Sit comfortably with your left hand on your knee.',
      'Close your right nostril with your right thumb.',
      'Inhale slowly through your left nostril for 4 counts.',
      'Close both nostrils and hold for 2 counts.',
      'Release your right nostril and exhale for 4 counts.',
      'Inhale through your right nostril for 4 counts.',
      'Close both nostrils and hold for 2 counts.',
      'Release your left nostril and exhale for 4 counts.',
      'Repeat the full cycle 3 times.',
    ],
    durationMinutes: 3,
    whyThisHelps:
      'Alternate nostril breathing balances sympathetic and parasympathetic tone. Small studies show blood pressure and heart rate variability improvements.',
  },
  {
    id: 'box-breathing',
    name: 'Box Breathing',
    tradition: 'Tactical breathing (US military training)',
    evidenceTier: 'moderate',
    steps: [
      'Sit upright and exhale all air from your lungs.',
      'Inhale slowly through your nose for 4 counts.',
      'Hold your breath for 4 counts.',
      'Exhale slowly through your mouth for 4 counts.',
      'Hold with lungs empty for 4 counts.',
      'Repeat the cycle 4 times.',
    ],
    durationMinutes: 2,
    whyThisHelps:
      'Equal-length breathing phases create a calming rhythm that reduces acute stress response.',
  },
] as const;

// ---------------------------------------------------------------------------
// Lookup functions
// ---------------------------------------------------------------------------

/**
 * Look up a breathwork template by ID.
 * Returns undefined if the ID does not match any template.
 */
export function getBreathworkTemplate(id: string): BreathworkTemplate | undefined {
  return BREATHWORK_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get a breathwork template by rotation index.
 * The rotation is based on the user's stress feedback count,
 * cycling through templates in order.
 */
export function getBreathworkByRotation(feedbackCount: number): BreathworkTemplate {
  const index = feedbackCount % BREATHWORK_TEMPLATES.length;
  return BREATHWORK_TEMPLATES[index] as BreathworkTemplate;
}
