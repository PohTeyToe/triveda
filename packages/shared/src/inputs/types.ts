/**
 * Shared Zod schemas and TypeScript types for additional input pathways:
 * face scan, daily check-in, and cultural matching.
 *
 * All three pathways depend on these schemas for validation at API boundaries.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Face scan reading
// ---------------------------------------------------------------------------

export const FaceScanReadingSchema = z.object({
  vata_delta: z.number().min(-1).max(1),
  pitta_delta: z.number().min(-1).max(1),
  kapha_delta: z.number().min(-1).max(1),
  wood_hint: z.number().min(0).max(1),
  fire_hint: z.number().min(0).max(1),
  earth_hint: z.number().min(0).max(1),
  metal_hint: z.number().min(0).max(1),
  water_hint: z.number().min(0).max(1),
  stress_level: z.number().min(0).max(1),
  skin_tone: z.string().min(1),
  confidence: z.number().min(0.4).max(0.7),
  simulated: z.literal(true),
  generated_at: z.string().datetime(),
  seed_hour: z.number().int(),
});

export type FaceScanReading = z.infer<typeof FaceScanReadingSchema>;

// ---------------------------------------------------------------------------
// Daily check-in
// ---------------------------------------------------------------------------

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const ChipSelectionSchema = z.enum(['left', 'right']).nullable();

export type ChipSelection = z.infer<typeof ChipSelectionSchema>;

export const DailyCheckInAnswerSchema = z.object({
  date: z.string().regex(DATE_REGEX, 'Must be YYYY-MM-DD format'),
  selections: z.record(z.string(), ChipSelectionSchema),
  dismissed: z.boolean(),
  synced: z.boolean(),
});

export type DailyCheckInAnswer = z.infer<typeof DailyCheckInAnswerSchema>;

// ---------------------------------------------------------------------------
// Cultural preferences
// ---------------------------------------------------------------------------

export const CulturalPreferenceSchema = z.object({
  cuisine_code: z.string().min(1),
  weight_override: z.number().min(0).max(0.1).optional(),
});

export type CulturalPreference = z.infer<typeof CulturalPreferenceSchema>;

export const CulturalRelationshipSchema = z.enum(['native', 'common', 'fusion', 'none']);
export type CulturalRelationship = z.infer<typeof CulturalRelationshipSchema>;

// ---------------------------------------------------------------------------
// Check-in chip pair definition
// ---------------------------------------------------------------------------

export const CheckInChipPairSchema = z.object({
  id: z.string(),
  left_label: z.string(),
  right_label: z.string(),
  left_vata_delta: z.number(),
  left_pitta_delta: z.number(),
  left_kapha_delta: z.number(),
  right_vata_delta: z.number(),
  right_pitta_delta: z.number(),
  right_kapha_delta: z.number(),
});

export type CheckInChipPair = z.infer<typeof CheckInChipPairSchema>;

// ---------------------------------------------------------------------------
// Dosha delta (plain type, not a schema -- computed internally)
// ---------------------------------------------------------------------------

export type DoshaDelta = {
  vata: number;
  pitta: number;
  kapha: number;
};
