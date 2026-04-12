/**
 * Seasonal transition routes.
 *
 * GET  /api/v1/seasonal-transition -- check if a seasonal transition is active
 * POST /api/v1/seasonal-transition/acknowledge -- dismiss the transition card
 */

import { seasonalTransitionAcknowledgements, userProfiles } from '@triveda/db';
import { getPreviousRitu, getSeasonalContext } from '@triveda/shared/src/engines/index.js';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthUser } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { getDb } from './helpers/db.js';

const AcknowledgeBodySchema = z.object({
  from_ritu: z.string().min(1),
  to_ritu: z.string().min(1),
});

type AppEnv = { Variables: { user: AuthUser } };

const seasonal = new Hono<AppEnv>();

/**
 * GET / -- check for active seasonal transition.
 */
seasonal.get('/', async (c) => {
  const user = c.get('user');
  const db = getDb();

  // Get user's latitude (default to 40 for northern hemisphere)
  const profileRows = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.user_id, user.id))
    .limit(1);

  const userProfile = profileRows[0];
  const lat = userProfile?.lat ? Number(userProfile.lat) : 40;

  const today = new Date().toISOString().slice(0, 10);
  const plainDate = Temporal.PlainDate.from(today);
  const seasonalResult = getSeasonalContext(plainDate, lat);
  const current = seasonalResult.context;

  if (!current.isTransition) {
    return c.json({ active: false, transition: null });
  }

  const fromRitu = current.adjacentRitu ?? getPreviousRitu(current.ayurvedaRitu);
  const toRitu = current.ayurvedaRitu;

  // Check if already acknowledged
  const ackRows = await db
    .select()
    .from(seasonalTransitionAcknowledgements)
    .where(
      and(
        eq(seasonalTransitionAcknowledgements.user_id, user.id),
        eq(seasonalTransitionAcknowledgements.from_ritu, fromRitu),
        eq(seasonalTransitionAcknowledgements.to_ritu, toRitu),
      ),
    )
    .limit(1);

  if (ackRows.length > 0) {
    return c.json({ active: false, transition: null });
  }

  return c.json({
    active: true,
    transition: {
      from_ritu: fromRitu,
      to_ritu: toRitu,
      from_tcm_phase: current.tcmPhase,
      to_tcm_phase: current.tcmPhase,
      ayurveda_explanation: `Transitioning from ${fromRitu} to ${toRitu} season. Adjust diet to balance changing dosha influences.`,
      tcm_explanation: `The ${current.tcmPhase} phase is shifting. Focus on foods that support the organ systems in transition.`,
      naturopathy_explanation:
        'Seasonal changes affect nutrient needs. Consider increasing vitamin D and immune-supporting foods.',
      tension: false,
      credit: {
        featureId: 'seasonal-ritu',
        featureName: 'Seasonal Ritu',
        active: true,
        contribution: 'Seasonal transition detection',
      },
    },
  });
});

/**
 * POST /acknowledge -- dismiss a seasonal transition notification.
 */
seasonal.post('/acknowledge', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const parsed = AcknowledgeBodySchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request body',
    );
  }

  const { from_ritu, to_ritu } = parsed.data;
  const db = getDb();

  await db
    .insert(seasonalTransitionAcknowledgements)
    .values({
      user_id: user.id,
      from_ritu,
      to_ritu,
    })
    .onConflictDoNothing();

  return c.json({ success: true });
});

export { seasonal };
