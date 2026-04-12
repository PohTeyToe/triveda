/**
 * Triggered recommendations routes.
 *
 * GET  /api/v1/triggered-recs          -- Get active triggered recommendations
 * POST /api/v1/triggered-recs/dismiss  -- Dismiss a trigger
 * POST /api/v1/triggered-recs/feedback -- Submit feedback on a trigger
 */

import {
  constitutionalProfiles,
  dailyCheckIns,
  foodBiases,
  lifestyleTriggerFeedback,
  triggerState,
} from '@triveda/db';
import { computeSuppressionEnd, detectPatterns, mergeCredits } from '@triveda/shared';
import type {
  ActiveTrigger,
  DailyCheckIn,
  TriggerFeedback,
  TriggerSuppressionState,
  UserState,
} from '@triveda/shared';
import type { ConstitutionalProfile } from '@triveda/shared';
import { and, desc, eq, gte } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { buildTriggerInstanceId } from '../lib/trigger-instance-id.js';
import type { AuthUser } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { getDb } from './helpers/db.js';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const DismissSchema = z.object({
  trigger_type: z.enum(['stress', 'digestive', 'energy', 'sleep']),
  dismissal_type: z.enum(['got_it', 'remind_me', 'not_interested']),
});

const FeedbackSchema = z.object({
  trigger_type: z.enum(['stress', 'digestive', 'energy', 'sleep']),
  trigger_instance_id: z.string().min(1),
  feedback_type: z.enum(['helped', 'tried', 'dismissed']),
  feedback_detail: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a default constitutional profile for users without one */
function defaultProfile(): ConstitutionalProfile {
  return {
    doshaScores: { vata: 0.33, pitta: 0.33, kapha: 0.34 },
    doshaType: { type: 'tridoshic', primary: 'vata', secondary: 'pitta', tertiary: 'kapha' },
    elementScores: null,
    primaryElement: null,
    secondaryElement: null,
    metabolicType: null,
    ansDominance: null,
    completeness: 0,
    confidence: 0,
    summary: '',
  };
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

type AppEnv = { Variables: { user: AuthUser } };

const triggeredRecs = new Hono<AppEnv>();

// GET /triggered-recs
triggeredRecs.get('/', async (c) => {
  const user = c.get('user');
  const db = getDb();
  const now = new Date();
  const nowIso = now.toISOString();

  // Load recent check-ins (last 14 days)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const cutoffDate = fourteenDaysAgo.toISOString().slice(0, 10);

  const checkInRows = await db
    .select()
    .from(dailyCheckIns)
    .where(and(eq(dailyCheckIns.user_id, user.id), gte(dailyCheckIns.date, cutoffDate)))
    .orderBy(desc(dailyCheckIns.date));

  // Map DB rows to DailyCheckIn type
  const recentCheckIns: DailyCheckIn[] = checkInRows.map((row) => ({
    date: row.date,
    mood: row.mood as DailyCheckIn['mood'],
    energy: row.energy as DailyCheckIn['energy'],
    digestion: row.digestion as DailyCheckIn['digestion'],
    sleepQuality: (row.sleep_quality as DailyCheckIn['sleepQuality']) ?? undefined,
    symptoms: row.symptoms ?? undefined,
  }));

  // Load trigger suppression state
  const stateRows = await db.select().from(triggerState).where(eq(triggerState.user_id, user.id));

  const suppressionState: TriggerSuppressionState[] = stateRows.map((row) => ({
    triggerType: row.trigger_type as TriggerSuppressionState['triggerType'],
    dismissalType: row.dismissal_type as TriggerSuppressionState['dismissalType'],
    dismissedAt: row.dismissed_at.toISOString(),
    suppressedUntil: row.suppressed_until?.toISOString() ?? null,
  }));

  // Load trigger feedback history
  const feedbackRows = await db
    .select()
    .from(lifestyleTriggerFeedback)
    .where(eq(lifestyleTriggerFeedback.user_id, user.id));

  const triggerFeedbackHistory: TriggerFeedback[] = feedbackRows.map((row) => ({
    triggerType: row.trigger_type as TriggerFeedback['triggerType'],
    triggerInstanceId: row.trigger_instance_id,
    feedbackType: row.feedback_type as TriggerFeedback['feedbackType'],
    feedbackDetail: (row.feedback_detail as TriggerFeedback['feedbackDetail']) ?? undefined,
    createdAt: row.created_at.toISOString(),
  }));

  // Load user profile
  const profileRows = await db
    .select()
    .from(constitutionalProfiles)
    .where(eq(constitutionalProfiles.user_id, user.id))
    .limit(1);

  const profileRow = profileRows[0];
  const profile: ConstitutionalProfile = profileRow
    ? {
        doshaScores: profileRow.dosha_ratios,
        doshaType: { type: 'tridoshic', primary: 'vata', secondary: 'pitta', tertiary: 'kapha' },
        elementScores: null,
        primaryElement:
          (profileRow.element_type as ConstitutionalProfile['primaryElement']) ?? null,
        secondaryElement: null,
        metabolicType: null,
        ansDominance: null,
        completeness: profileRow.completeness,
        confidence: 0,
        summary: profileRow.plain_language_summary,
      }
    : defaultProfile();

  // Build UserState and detect patterns
  const userState: UserState = {
    profile,
    recentCheckIns,
    triggerState: suppressionState,
    triggerFeedbackHistory,
  };

  const triggers: ActiveTrigger[] = detectPatterns(userState, nowIso);

  // Write food bias if the display trigger has one
  const displayTrigger = triggers.find((t) => t.display && t.foodBias);
  if (displayTrigger?.foodBias) {
    const bias = displayTrigger.foodBias;
    const expiresAt = new Date(now.getTime() + bias.expiresAfterDays * 24 * 60 * 60 * 1000);

    await db
      .insert(foodBiases)
      .values({
        user_id: user.id,
        bias_type: bias.tag,
        bias_config: { tag: bias.tag, multiplier: bias.multiplier },
        expires_at: expiresAt,
        source_trigger: displayTrigger.type,
      })
      .onConflictDoUpdate({
        target: [foodBiases.user_id, foodBiases.bias_type],
        set: {
          bias_config: { tag: bias.tag, multiplier: bias.multiplier },
          expires_at: expiresAt,
          source_trigger: displayTrigger.type,
          created_at: now,
        },
      });
  }

  // Merge credits from all active triggers
  const allCredits = triggers.map((t) => t.creditSources);
  const mergedCredits = mergeCredits(allCredits);

  return c.json({ triggers, credits: mergedCredits });
});

// POST /triggered-recs/dismiss
triggeredRecs.post('/dismiss', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const parsed = DismissSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request body',
    );
  }

  const { trigger_type, dismissal_type } = parsed.data;
  const now = new Date();
  const nowIso = now.toISOString();
  const suppressedUntilStr = computeSuppressionEnd(dismissal_type, nowIso);
  const suppressedUntil = suppressedUntilStr ? new Date(suppressedUntilStr) : null;
  const db = getDb();

  await db
    .insert(triggerState)
    .values({
      user_id: user.id,
      trigger_type,
      dismissal_type,
      dismissed_at: now,
      suppressed_until: suppressedUntil,
    })
    .onConflictDoUpdate({
      target: [triggerState.user_id, triggerState.trigger_type],
      set: {
        dismissal_type,
        dismissed_at: now,
        suppressed_until: suppressedUntil,
        created_at: now,
      },
    });

  return c.json({ success: true });
});

// POST /triggered-recs/feedback
triggeredRecs.post('/feedback', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const parsed = FeedbackSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request body',
    );
  }

  const { trigger_type, trigger_instance_id, feedback_type, feedback_detail } = parsed.data;
  const db = getDb();

  await db.insert(lifestyleTriggerFeedback).values({
    user_id: user.id,
    trigger_type,
    trigger_instance_id,
    feedback_type,
    feedback_detail: feedback_detail ?? null,
  });

  return c.json({ success: true });
});

export { triggeredRecs };
