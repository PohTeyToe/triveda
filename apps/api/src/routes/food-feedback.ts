/**
 * Food feedback route -- POST /api/v1/food-feedback
 *
 * Records user feedback on food suggestions (tried/rejected).
 * Used by the scoring engine's anti-repetition factor on the next
 * /daily-food call.
 */

import { foodFeedback } from '@triveda/db';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthUser } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { getDb } from './helpers/db.js';

const FeedbackBodySchema = z.object({
  suggestion_id: z.string().uuid(),
  response: z.enum(['tried', 'rejected']),
  symptom_tag: z.string().max(100).optional(),
});

type AppEnv = { Variables: { user: AuthUser } };

const feedbackRoute = new Hono<AppEnv>();

feedbackRoute.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const parsed = FeedbackBodySchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      parsed.error.issues[0]?.message ?? 'Invalid request body',
    );
  }

  const { suggestion_id, response, symptom_tag } = parsed.data;
  const db = getDb();

  await db
    .insert(foodFeedback)
    .values({
      user_id: user.id,
      suggestion_id,
      response,
      symptom_tag: symptom_tag ?? null,
    })
    .onConflictDoUpdate({
      target: [foodFeedback.user_id, foodFeedback.suggestion_id],
      set: {
        response,
        symptom_tag: symptom_tag ?? null,
        created_at: new Date(),
      },
    });

  return c.json({ success: true });
});

export { feedbackRoute };
