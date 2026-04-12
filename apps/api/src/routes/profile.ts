/**
 * Profile routes -- GET /api/v1/profile, PATCH /api/v1/profile
 *
 * User profile management: dietary restrictions, tradition visibility,
 * location, timezone, weekly herb day, etc.
 */

import { userProfiles } from '@triveda/db';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthUser } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { getDb } from './helpers/db.js';

const PatchProfileBodySchema = z
  .object({
    dietary_restrictions: z.array(z.string()).optional(),
    tradition_visibility: z
      .object({
        ayurveda: z.boolean(),
        tcm: z.boolean(),
        naturopathy: z.boolean(),
      })
      .optional(),
    cultural_cuisine_preferences: z.array(z.string()).optional(),
    lat: z.number().min(-90).max(90).nullable().optional(),
    lon: z.number().min(-180).max(180).nullable().optional(),
    city: z.string().max(200).nullable().optional(),
    weekly_herb_day: z.number().int().min(0).max(6).optional(),
    timezone: z.string().max(100).optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one field must be provided',
  });

const DEFAULT_PROFILE = {
  dietary_restrictions: [] as string[],
  tradition_visibility: { ayurveda: true, tcm: true, naturopathy: true },
  cultural_cuisine_preferences: [] as string[],
  lat: null as number | null,
  lon: null as number | null,
  city: null as string | null,
  weekly_herb_day: 0,
  timezone: 'UTC',
  profile_completeness: 0,
};

type AppEnv = { Variables: { user: AuthUser } };

const profile = new Hono<AppEnv>();

/**
 * GET / -- return current user's profile or defaults.
 */
profile.get('/', async (c) => {
  const user = c.get('user');
  const db = getDb();

  const rows = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.user_id, user.id))
    .limit(1);

  if (rows.length === 0) {
    return c.json({
      user_id: user.id,
      ...DEFAULT_PROFILE,
    });
  }

  const row = rows[0];
  if (!row) {
    return c.json({ user_id: user.id, ...DEFAULT_PROFILE });
  }
  return c.json({
    user_id: user.id,
    dietary_restrictions: row.dietary_restrictions ?? [],
    tradition_visibility: row.tradition_visibility ?? DEFAULT_PROFILE.tradition_visibility,
    cultural_cuisine_preferences: row.cultural_cuisine_preferences ?? [],
    lat: row.lat ? Number(row.lat) : null,
    lon: row.lon ? Number(row.lon) : null,
    city: row.city,
    weekly_herb_day: row.weekly_herb_day ?? 0,
    timezone: row.timezone ?? 'UTC',
    profile_completeness: row.profile_completeness ?? 0,
  });
});

/**
 * PATCH / -- update user profile fields. Upserts if no profile exists.
 */
profile.patch('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const parsed = PatchProfileBodySchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request body',
    );
  }

  const updates = parsed.data;
  const db = getDb();

  // Build the set object with only provided fields
  const setFields: Record<string, unknown> = { updated_at: new Date() };
  if (updates.dietary_restrictions !== undefined)
    setFields.dietary_restrictions = updates.dietary_restrictions;
  if (updates.tradition_visibility !== undefined)
    setFields.tradition_visibility = updates.tradition_visibility;
  if (updates.cultural_cuisine_preferences !== undefined)
    setFields.cultural_cuisine_preferences = updates.cultural_cuisine_preferences;
  if (updates.lat !== undefined) setFields.lat = updates.lat !== null ? String(updates.lat) : null;
  if (updates.lon !== undefined) setFields.lon = updates.lon !== null ? String(updates.lon) : null;
  if (updates.city !== undefined) setFields.city = updates.city;
  if (updates.weekly_herb_day !== undefined) setFields.weekly_herb_day = updates.weekly_herb_day;
  if (updates.timezone !== undefined) setFields.timezone = updates.timezone;

  await db
    .insert(userProfiles)
    .values({
      user_id: user.id,
      ...setFields,
    })
    .onConflictDoUpdate({
      target: userProfiles.user_id,
      set: setFields,
    });

  // Return the updated profile
  const rows = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.user_id, user.id))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return c.json({ user_id: user.id, ...DEFAULT_PROFILE });
  }
  return c.json({
    user_id: user.id,
    dietary_restrictions: row.dietary_restrictions ?? [],
    tradition_visibility: row.tradition_visibility ?? DEFAULT_PROFILE.tradition_visibility,
    cultural_cuisine_preferences: row.cultural_cuisine_preferences ?? [],
    lat: row.lat ? Number(row.lat) : null,
    lon: row.lon ? Number(row.lon) : null,
    city: row.city,
    weekly_herb_day: row.weekly_herb_day ?? 0,
    timezone: row.timezone ?? 'UTC',
    profile_completeness: row.profile_completeness ?? 0,
  });
});

export { profile };
