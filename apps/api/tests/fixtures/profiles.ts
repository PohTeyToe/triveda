/**
 * Constitutional profile fixtures for route tests.
 */

import type { Answer } from '@triveda/shared/src/engines/types.js';

export const SEED_ANSWERS: Answer[] = [
  { questionId: 1, choice: 'a' }, // thin, light (vata)
  { questionId: 4, choice: 'b' }, // strong digestion (pitta)
  { questionId: 9, choice: 'c' }, // moderate appetite (kapha)
];

export const VATA_ANSWERS: Answer[] = [
  { questionId: 1, choice: 'a' },
  { questionId: 2, choice: 'a' },
  { questionId: 3, choice: 'a' },
];

export const PITTA_ANSWERS: Answer[] = [
  { questionId: 1, choice: 'b' },
  { questionId: 2, choice: 'b' },
  { questionId: 3, choice: 'b' },
];

export const FULL_ANSWERS: Answer[] = Array.from({ length: 18 }, (_, i) => ({
  questionId: i + 1,
  choice: 'a',
}));

export const TWO_ANSWERS: Answer[] = [
  { questionId: 1, choice: 'a' },
  { questionId: 2, choice: 'b' },
];

export const FOUR_ANSWERS: Answer[] = [
  { questionId: 1, choice: 'a' },
  { questionId: 2, choice: 'b' },
  { questionId: 3, choice: 'c' },
  { questionId: 4, choice: 'a' },
];
