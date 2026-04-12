/**
 * Public constitution metadata endpoint.
 *
 * GET /api/v1/constitution/:id/meta -- return constitution summary for OG tag generation.
 * No auth required. Used by the Vercel serverless function for crawler OG injection.
 */

import { constitutionalProfiles } from '@triveda/db';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { getDb } from './helpers/db.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const constitutionMeta = new Hono();

/**
 * GET /:id/meta -- public metadata for a constitution.
 * Returns summary and tradition names for OG tag population.
 */
constitutionMeta.get('/:id/meta', async (c) => {
  const id = c.req.param('id');

  if (!UUID_REGEX.test(id)) {
    return c.json({ error: 'Invalid constitution ID format', code: 'INVALID_ID' }, 400);
  }

  try {
    const db = getDb();
    const rows = await db
      .select({
        id: constitutionalProfiles.id,
        plain_language_summary: constitutionalProfiles.plain_language_summary,
        tradition_sections: constitutionalProfiles.tradition_sections,
      })
      .from(constitutionalProfiles)
      .where(eq(constitutionalProfiles.id, id))
      .limit(1);

    const record = rows[0];

    if (!record) {
      return c.json({ error: 'Constitution not found', code: 'NOT_FOUND' }, 404);
    }

    const traditions = record.tradition_sections as Record<string, string> | null;

    return c.json(
      {
        id: record.id,
        summary: record.plain_language_summary ?? '',
        traditions: {
          ayurveda: traditions?.ayurveda ?? '',
          tcm: traditions?.tcm ?? '',
          naturopathy: traditions?.naturopathy ?? '',
        },
      },
      200,
      {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    );
  } catch (err) {
    console.error('[constitution-meta] Error fetching metadata:', err);
    return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500);
  }
});

export { constitutionMeta };
