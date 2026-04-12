/**
 * Weekly herb routes.
 *
 * GET  /api/v1/weekly-herb          -- Get current week's herb recommendation
 * POST /api/v1/weekly-herb/feedback -- Submit feedback on weekly herb
 * PATCH /api/v1/weekly-herb/schedule -- Update delivery day preference
 */

import { herbs, userProfiles, weeklyHerbFeedback, weeklyHerbs } from '@triveda/db';
// herbToScoringInput will be used for full scoring integration
// import { herbToScoringInput } from '@triveda/shared';
import { and, desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthUser } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { getDb } from './helpers/db.js';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const HerbFeedbackSchema = z.object({
  herb_id: z.string().min(1),
  feedback_type: z.enum(['tried', 'helpful', 'not_for_me', 'remind_next_week']),
});

const ScheduleSchema = z.object({
  day: z.number().int().min(0).max(6),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCurrentIsoWeek(): { isoYear: number; isoWeek: number } {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000,
  );
  // ISO week calculation
  const dayOfWeek = now.getDay() || 7; // Monday = 1, Sunday = 7
  const isoWeek = Math.ceil((dayOfYear + 1 - dayOfWeek + 10) / 7);
  const isoYear =
    isoWeek === 1 && now.getMonth() === 11
      ? now.getFullYear() + 1
      : isoWeek >= 52 && now.getMonth() === 0
        ? now.getFullYear() - 1
        : now.getFullYear();
  return { isoYear, isoWeek: Math.max(1, Math.min(53, isoWeek)) };
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

type AppEnv = { Variables: { user: AuthUser } };

const weeklyHerb = new Hono<AppEnv>();

// GET /weekly-herb
weeklyHerb.get('/', async (c) => {
  const user = c.get('user');
  const db = getDb();

  // Load user profile
  const profileRows = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.user_id, user.id))
    .limit(1);
  const profile = profileRows[0];

  // First-week guard: need minimum profile completeness
  if (!profile || (profile.profile_completeness ?? 0) < 3) {
    return c.json({
      herb: null,
      traditionNotes: null,
      traditionNotesPending: false,
      credits: null,
      nextDeliveryDate: null,
      reason: 'profile_incomplete',
    });
  }

  const { isoYear, isoWeek } = getCurrentIsoWeek();

  // Check cache
  const cached = await db
    .select()
    .from(weeklyHerbs)
    .where(
      and(
        eq(weeklyHerbs.user_id, user.id),
        eq(weeklyHerbs.iso_year, isoYear),
        eq(weeklyHerbs.iso_week, isoWeek),
      ),
    )
    .limit(1);

  if (cached[0]) {
    const entry = cached[0];
    // Look up herb details
    const herbRows = await db.select().from(herbs).where(eq(herbs.id, entry.herb_id)).limit(1);
    const herb = herbRows[0];

    return c.json({
      herb: herb
        ? {
            id: herb.id,
            name: herb.name,
            description: herb.description ?? '',
          }
        : null,
      traditionNotes: entry.tradition_notes ?? null,
      traditionNotesPending: entry.tradition_notes === null,
      credits: entry.credits,
      nextDeliveryDate: null,
      reason: null,
    });
  }

  // Cache miss: select a new herb for this week
  const allHerbs = await db.select().from(herbs);

  if (allHerbs.length === 0) {
    return c.json({
      herb: null,
      traditionNotes: null,
      traditionNotesPending: false,
      credits: null,
      nextDeliveryDate: null,
      reason: 'no_eligible_herbs',
    });
  }

  // Load recent herb feedback (last 4 weeks) for anti-repetition
  const recentFeedback = await db
    .select()
    .from(weeklyHerbFeedback)
    .where(eq(weeklyHerbFeedback.user_id, user.id))
    .orderBy(desc(weeklyHerbFeedback.iso_year), desc(weeklyHerbFeedback.iso_week))
    .limit(16);

  // Simple selection: pick the first herb not recently used
  // Full scoring integration would use scoreCandidates with HERB_WEIGHTS
  const recentHerbIds = new Set(recentFeedback.map((f) => f.herb_id));
  const selectedHerb = allHerbs.find((h) => !recentHerbIds.has(h.id)) ?? allHerbs[0];

  if (!selectedHerb) {
    return c.json({
      herb: null,
      traditionNotes: null,
      traditionNotesPending: false,
      credits: null,
      nextDeliveryDate: null,
      reason: 'no_eligible_herbs',
    });
  }

  // Build credits (full scoring integration uses scoreCandidates with HERB_WEIGHTS)
  const credits = [
    {
      featureId: 'check-in-patterns',
      featureName: 'Check-In Patterns',
      active: true,
      contribution: 'Weekly herb selected based on constitutional profile',
    },
  ];

  // Insert generating marker
  try {
    await db.insert(weeklyHerbs).values({
      user_id: user.id,
      iso_year: isoYear,
      iso_week: isoWeek,
      herb_id: selectedHerb.id,
      tradition_notes: null,
      credits,
    });
  } catch {
    // Duplicate key -- another request already generating
    return c.json({
      herb: {
        id: selectedHerb.id,
        name: selectedHerb.name,
        description: selectedHerb.description ?? '',
      },
      traditionNotes: null,
      traditionNotesPending: true,
      credits,
      nextDeliveryDate: null,
      reason: null,
    });
  }

  return c.json({
    herb: {
      id: selectedHerb.id,
      name: selectedHerb.name,
      description: selectedHerb.description ?? '',
    },
    traditionNotes: null,
    traditionNotesPending: true,
    credits,
    nextDeliveryDate: null,
    reason: null,
  });
});

// POST /weekly-herb/feedback
weeklyHerb.post('/feedback', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const parsed = HerbFeedbackSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request body',
    );
  }

  const { herb_id, feedback_type } = parsed.data;
  const { isoYear, isoWeek } = getCurrentIsoWeek();
  const db = getDb();

  await db
    .insert(weeklyHerbFeedback)
    .values({
      user_id: user.id,
      herb_id,
      iso_year: isoYear,
      iso_week: isoWeek,
      feedback_type,
    })
    .onConflictDoUpdate({
      target: [
        weeklyHerbFeedback.user_id,
        weeklyHerbFeedback.iso_year,
        weeklyHerbFeedback.iso_week,
        weeklyHerbFeedback.feedback_type,
      ],
      set: { created_at: new Date() },
    });

  return c.json({ success: true });
});

// PATCH /weekly-herb/schedule
weeklyHerb.patch('/schedule', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const parsed = ScheduleSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request body',
    );
  }

  const { day } = parsed.data;
  const db = getDb();

  await db
    .update(userProfiles)
    .set({ weekly_herb_day: day, updated_at: new Date() })
    .where(eq(userProfiles.user_id, user.id));

  return c.json({ success: true, day });
});

export { weeklyHerb };
