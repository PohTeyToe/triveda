/**
 * Triggered outputs type definitions.
 *
 * Types for the pattern detection framework and weekly herb system.
 * No runtime logic -- just shapes.
 */

import type { CreditSource } from '../credits.js';
import type { ConstitutionalProfile } from '../engines/types.js';

// ---------------------------------------------------------------------------
// String unions
// ---------------------------------------------------------------------------

export type TriggerType = 'stress' | 'digestive' | 'energy' | 'sleep';

export type DismissalType = 'got_it' | 'remind_me' | 'not_interested';

export type FeedbackType = 'helped' | 'tried' | 'dismissed';

// ---------------------------------------------------------------------------
// Check-in types
// ---------------------------------------------------------------------------

export interface DailyCheckIn {
  date: string; // ISO date string YYYY-MM-DD
  mood: 'great' | 'good' | 'okay' | 'poor' | 'bad';
  energy: 'high' | 'medium' | 'low';
  digestion: 'great' | 'good' | 'okay' | 'poor' | 'bad';
  sleepQuality?: 'rested' | 'groggy';
  symptoms?: string[];
}

// ---------------------------------------------------------------------------
// Suppression and feedback
// ---------------------------------------------------------------------------

export interface TriggerSuppressionState {
  triggerType: TriggerType;
  dismissalType: DismissalType;
  dismissedAt: string; // ISO datetime string
  suppressedUntil: string | null; // ISO datetime string or null for got_it
}

export interface TriggerFeedback {
  triggerType: TriggerType;
  triggerInstanceId: string;
  feedbackType: FeedbackType;
  feedbackDetail?: DismissalType;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// User state (input to pattern detector)
// ---------------------------------------------------------------------------

export interface UserState {
  profile: ConstitutionalProfile;
  recentCheckIns: DailyCheckIn[];
  triggerState: TriggerSuppressionState[];
  triggerFeedbackHistory: TriggerFeedback[];
}

// ---------------------------------------------------------------------------
// Breathwork
// ---------------------------------------------------------------------------

export interface BreathworkTemplate {
  id: string;
  name: string;
  tradition: string;
  evidenceTier: 'high' | 'moderate' | 'traditional' | 'speculative';
  steps: string[];
  durationMinutes: number;
  whyThisHelps: string;
}

// ---------------------------------------------------------------------------
// Food bias
// ---------------------------------------------------------------------------

export interface FoodBias {
  tag: string; // e.g. 'ojas_building'
  multiplier: number; // e.g. 1.1
  expiresAfterDays: number; // e.g. 1
}

// ---------------------------------------------------------------------------
// Trigger candidates and results
// ---------------------------------------------------------------------------

export interface TriggerRecommendation {
  title: string;
  body: string;
  learnMore?: BreathworkTemplate;
  tradition: string;
}

export interface TriggerCandidate {
  type: TriggerType;
  severity: number; // (count - threshold) * weight
  recommendation: TriggerRecommendation;
  matchingCheckIns: DailyCheckIn[];
  creditSources: CreditSource[];
  foodBias?: FoodBias;
}

export interface ActiveTrigger extends TriggerCandidate {
  display: boolean; // true for top-ranked trigger only
}

// ---------------------------------------------------------------------------
// Rule function signature
// ---------------------------------------------------------------------------

export type TriggerRule = (state: UserState, now: string) => TriggerCandidate | null;

// ---------------------------------------------------------------------------
// Chip-to-field mapping
// ---------------------------------------------------------------------------

export interface ChipFieldMapping {
  field: keyof DailyCheckIn;
  matchValues: string[];
  triggerType: TriggerType;
}
