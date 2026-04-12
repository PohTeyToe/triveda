/**
 * Daily check-in route -- POST /api/v1/daily-check-in
 *
 * Records mood, energy, digestion, and optional symptoms.
 * One check-in per user per day (upsert on user_id + date).
 */

import { dailyCheckIns } from '@triveda/db';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthUser } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { getDb } from './helpers/db.js';

const CheckInBodySchema = z.object({
  mood: z.enum(['great', 'good', 'okay', 'poor', 'bad']),
  energy: z.enum(['high', 'medium', 'low']),
  digestion: z.enum(['great', 'good', 'okay', 'poor', 'bad']),
  symptoms: z.array(z.string().max(100)).max(10).optional(),
});

type AppEnv = { Variables: { user: AuthUser } };

const checkIn = new Hono<AppEnv>();

checkIn.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const parsed = CheckInBodySchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request body',
    );
  }

  const { mood, energy, digestion, symptoms } = parsed.data;
  const today = new Date().toISOString().slice(0, 10);
  const db = getDb();

  await db
    .insert(dailyCheckIns)
    .values({
      user_id: user.id,
      date: today,
      mood,
      energy,
      digestion,
      symptoms: symptoms ?? null,
    })
    .onConflictDoUpdate({
      target: [dailyCheckIns.user_id, dailyCheckIns.date],
      set: {
        mood,
        energy,
        digestion,
        symptoms: symptoms ?? null,
        updated_at: new Date(),
      },
    });

  return c.json({ success: true, timestamp: new Date().toISOString() });
});

export { checkIn };
