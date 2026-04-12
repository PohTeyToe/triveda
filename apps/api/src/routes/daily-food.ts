/**
 * Daily food route -- GET /api/v1/daily-food
 *
 * The most complex endpoint. Orchestrates all upstream splits into a
 * single response. Supports both blocking JSON and SSE streaming based
 * on the Accept header.
 */

import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import { composeDailyFood, composeDailyFoodSSE } from '../lib/compose-daily-food.js';
import type { AuthUser } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { getDb } from './helpers/db.js';

// ---------------------------------------------------------------------------
// Query parameter validation
// ---------------------------------------------------------------------------

const DailyFoodQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD format'),
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

type AppEnv = { Variables: { user: AuthUser; requestId: string } };

const dailyFood = new Hono<AppEnv>();

dailyFood.get('/', async (c) => {
  const user = c.get('user');
  const requestId = (c.get('requestId') as string) ?? crypto.randomUUID();

  // Validate query params
  const query = DailyFoodQuerySchema.safeParse({
    date: c.req.query('date'),
    lat: c.req.query('lat'),
    lon: c.req.query('lon'),
  });

  if (!query.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      query.error.issues[0]?.message ?? 'Invalid query parameters',
    );
  }

  const { date, lat, lon } = query.data;
  const db = getDb();

  const params = { userId: user.id, date, lat, lon, requestId, db };

  // Content negotiation
  const accept = c.req.header('Accept') ?? '';

  if (accept.includes('text/event-stream')) {
    // SSE streaming mode
    return streamSSE(c, async (stream) => {
      const signal = c.req.raw.signal;

      stream.onAbort(() => {
        // Client disconnected -- cleanup handled by abort signal propagation
      });

      try {
        for await (const event of composeDailyFoodSSE(params, signal)) {
          if (signal?.aborted) break;
          await stream.writeSSE({
            event: event.event,
            data: JSON.stringify(event.data),
          });
        }
      } catch (err) {
        await stream.writeSSE({
          event: 'error',
          data: JSON.stringify({
            tradition: 'unknown',
            message: err instanceof Error ? err.message : 'Unknown error',
          }),
        });
        await stream.writeSSE({
          event: 'done',
          data: '{}',
        });
      }
    });
  }

  // Blocking JSON mode
  const result = await composeDailyFood(params);

  return c.json({
    food: {
      id: result.food.foodId,
      name: result.food.foodName,
      totalScore: result.food.totalScore,
      breakdown: result.food.breakdown,
    },
    three_tradition_output: {
      ayurveda: result.llmResult.ayurveda,
      tcm: result.llmResult.tcm,
      naturopathy: result.llmResult.naturopathy,
      synthesis: result.llmResult.synthesis,
    },
    convergence_report: result.convergenceReport.report,
    optional_profiling_question: result.profilingQuestion,
    credits: result.credits,
  });
});

export { dailyFood };
