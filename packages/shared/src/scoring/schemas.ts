/**
 * Zod validation schemas for scoring engine inputs.
 *
 * Used at the API boundary to validate data before it enters the
 * scoring pipeline. The scoring engine itself operates on typed
 * interfaces -- these schemas validate external input only.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Scalar unions
// ---------------------------------------------------------------------------

export const RituSchema = z.enum(['shishira', 'vasanta', 'grishma', 'varsha', 'sharad', 'hemanta']);

export const TCMElementSchema = z.enum(['wood', 'fire', 'earth', 'metal', 'water']);

export const ThermalNatureSchema = z.enum(['hot', 'warm', 'neutral', 'cool', 'cold']);

export const FeedbackResponseSchema = z.enum(['accepted', 'rejected', 'ignored']);

// ---------------------------------------------------------------------------
// Food input schemas
// ---------------------------------------------------------------------------

export const FoodAyurvedaSchema = z.object({
  vataEffect: z.number().min(-2).max(2),
  pittaEffect: z.number().min(-2).max(2),
  kaphaEffect: z.number().min(-2).max(2),
  rituFit: z.record(RituSchema, z.number().min(0).max(1)),
});

export const FoodTCMSchema = z.object({
  thermalNature: ThermalNatureSchema,
  organAffinity: z.array(z.string()),
  elementFit: z.record(TCMElementSchema, z.number().min(0).max(1)),
});

export const FoodForScoringSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  tags: z.array(z.string()),
  contraindications: z.array(z.string()).optional(),
  ayurveda: FoodAyurvedaSchema,
  tcm: FoodTCMSchema,
});

// ---------------------------------------------------------------------------
// Context schemas
// ---------------------------------------------------------------------------

export const FoodFeedbackSchema = z.object({
  foodId: z.string().uuid(),
  date: z.string().date(),
  response: FeedbackResponseSchema,
});

export const ModifierValuesSchema = z.object({
  bloodWork: z.number().min(0.8).max(1.2).optional(),
  culturalMatch: z.number().min(1.0).max(1.1).optional(),
  dailyCheckIn: z.number().min(0.9).max(1.1).optional(),
});
