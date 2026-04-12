/**
 * Face scan route -- POST /api/v1/face-scan
 *
 * Accepts simulated face-scan readings (dosha deltas, element hints,
 * stress level) and persists them. One reading per user per seed_hour.
 */

import { faceScanReadings } from '@triveda/db';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthUser } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { getDb } from './helpers/db.js';

const FaceScanBodySchema = z.object({
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

type AppEnv = { Variables: { user: AuthUser } };

const faceScan = new Hono<AppEnv>();

faceScan.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const parsed = FaceScanBodySchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request body',
    );
  }

  const data = parsed.data;
  const db = getDb();

  const result = await db
    .insert(faceScanReadings)
    .values({
      user_id: user.id,
      vata_delta: String(data.vata_delta),
      pitta_delta: String(data.pitta_delta),
      kapha_delta: String(data.kapha_delta),
      wood_hint: String(data.wood_hint),
      fire_hint: String(data.fire_hint),
      earth_hint: String(data.earth_hint),
      metal_hint: String(data.metal_hint),
      water_hint: String(data.water_hint),
      stress_level: String(data.stress_level),
      skin_tone: data.skin_tone,
      confidence: String(data.confidence),
      simulated: data.simulated,
      seed_hour: data.seed_hour,
      generated_at: new Date(data.generated_at),
    })
    .onConflictDoUpdate({
      target: [faceScanReadings.user_id, faceScanReadings.seed_hour],
      set: {
        vata_delta: String(data.vata_delta),
        pitta_delta: String(data.pitta_delta),
        kapha_delta: String(data.kapha_delta),
        wood_hint: String(data.wood_hint),
        fire_hint: String(data.fire_hint),
        earth_hint: String(data.earth_hint),
        metal_hint: String(data.metal_hint),
        water_hint: String(data.water_hint),
        stress_level: String(data.stress_level),
        skin_tone: data.skin_tone,
        confidence: String(data.confidence),
        generated_at: new Date(data.generated_at),
      },
    })
    .returning({ id: faceScanReadings.id });

  const inserted = result[0];
  return c.json({ id: inserted?.id ?? '' });
});

export { faceScan };
