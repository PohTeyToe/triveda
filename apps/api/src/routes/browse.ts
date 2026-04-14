/**
 * Browse routes -- GET /api/v1/foods/browse and GET /api/v1/herbs/browse
 *
 * Cursor-based pagination using item ID as cursor.
 * Items ordered by name ASC, id ASC for stable ordering.
 */

import { foods, herbs } from '@triveda/db';
import { and, asc, eq, gt } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthUser } from '../middleware/auth.js';
import { getDb } from './helpers/db.js';

const BrowseQuerySchema = z.object({
  category: z.string().optional(),
  season: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

type AppEnv = { Variables: { user: AuthUser } };

const browse = new Hono<AppEnv>();

/**
 * GET /foods/browse -- browse foods with cursor pagination.
 */
browse.get('/foods/browse', async (c) => {
  const query = BrowseQuerySchema.safeParse({
    category: c.req.query('category'),
    season: c.req.query('season'),
    cursor: c.req.query('cursor'),
    limit: c.req.query('limit'),
  });

  const params = query.success ? query.data : { limit: 20 };
  const db = getDb();

  const conditions = [];
  if (params.category) {
    conditions.push(eq(foods.category, params.category));
  }
  if (params.cursor) {
    conditions.push(gt(foods.id, params.cursor));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await db
    .select()
    .from(foods)
    .where(whereClause)
    .orderBy(asc(foods.name), asc(foods.id))
    .limit(params.limit + 1); // Fetch one extra to check for next page

  const hasMore = items.length > params.limit;
  const pageItems = hasMore ? items.slice(0, params.limit) : items;
  const nextCursor =
    hasMore && pageItems.length > 0 ? (pageItems[pageItems.length - 1]?.id ?? null) : null;

  return c.json({ items: pageItems, nextCursor });
});

/**
 * GET /herbs/browse -- browse herbs with cursor pagination.
 */
browse.get('/herbs/browse', async (c) => {
  const query = BrowseQuerySchema.safeParse({
    category: c.req.query('category'),
    cursor: c.req.query('cursor'),
    limit: c.req.query('limit'),
  });

  const params = query.success ? query.data : { limit: 20 };
  const db = getDb();

  const conditions = [];
  if (params.category) {
    conditions.push(eq(herbs.category, params.category));
  }
  if (params.cursor) {
    conditions.push(gt(herbs.id, params.cursor));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await db
    .select()
    .from(herbs)
    .where(whereClause)
    .orderBy(asc(herbs.name), asc(herbs.id))
    .limit(params.limit + 1);

  const hasMore = items.length > params.limit;
  const pageItems = hasMore ? items.slice(0, params.limit) : items;
  const nextCursor =
    hasMore && pageItems.length > 0 ? (pageItems[pageItems.length - 1]?.id ?? null) : null;

  return c.json({ items: pageItems, nextCursor });
});

/**
 * GET /foods/:id -- fetch a single food by ID.
 */
browse.get('/foods/:id', async (c) => {
  const id = c.req.param('id');
  const db = getDb();

  const rows = await db.select().from(foods).where(eq(foods.id, id)).limit(1);
  const food = rows[0];

  if (!food) {
    return c.json({ error: 'Food not found' }, 404);
  }

  return c.json(food);
});

/**
 * GET /herbs/:id -- fetch a single herb by ID.
 */
browse.get('/herbs/:id', async (c) => {
  const id = c.req.param('id');
  const db = getDb();

  const rows = await db.select().from(herbs).where(eq(herbs.id, id)).limit(1);
  const herb = rows[0];

  if (!herb) {
    return c.json({ error: 'Herb not found' }, 404);
  }

  return c.json(herb);
});

export { browse };
