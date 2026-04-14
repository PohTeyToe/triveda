import type { CheckInAnswer } from './demo-user.fixture';

/**
 * Predefined check-in sequences for triggering engine behaviour.
 *
 * `anxiousSequence` over 3 consecutive days is the canonical trigger for the
 * breathwork lifestyle card (split 12 pattern detector).
 */

export const neutralSequence: CheckInAnswer[] = [
  { mood: 'neutral', energy: 'moderate', digestion: 'normal' },
  { mood: 'neutral', energy: 'moderate', digestion: 'normal' },
  { mood: 'neutral', energy: 'moderate', digestion: 'normal' },
];

export const anxiousSequence: CheckInAnswer[] = [
  { mood: 'anxious', energy: 'low', digestion: 'bloated' },
  { mood: 'anxious', energy: 'low', digestion: 'bloated' },
  { mood: 'anxious', energy: 'low', digestion: 'bloated' },
];

export const energeticSequence: CheckInAnswer[] = [
  { mood: 'calm', energy: 'high', digestion: 'good' },
  { mood: 'calm', energy: 'high', digestion: 'good' },
  { mood: 'calm', energy: 'high', digestion: 'good' },
];
