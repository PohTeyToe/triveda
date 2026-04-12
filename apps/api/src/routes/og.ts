/**
 * OG image routes for social media link previews.
 *
 * GET /api/og/constitution/:id -- render dynamic OG image for a constitution
 * GET /api/og/default           -- serve the static default OG image
 *
 * Error handling philosophy: NEVER return 500 or 404.
 * Every error path falls back to the default image with a 200 status.
 * Social platforms cache error responses aggressively -- a single 500 means
 * a broken preview for hours or days.
 */

import { join } from 'node:path';
import { constitutionalProfiles } from '@triveda/db';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { ConstitutionCardOG } from '../lib/og/render-constitution.js';
import { renderOgImage } from '../lib/og/satori-renderer.js';
import { getDb } from './helpers/db.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/** Read the pre-rendered default OG image from disk. */
async function getDefaultOgImage(): Promise<Buffer> {
  const fontsDir =
    typeof import.meta.dir === 'string'
      ? join(import.meta.dir, '..', '..', 'assets', 'images')
      : join(process.cwd(), 'assets', 'images');
  const filePath = join(fontsDir, 'og-default.png');
  const file = Bun.file(filePath);
  const exists = await file.exists();
  if (!exists) {
    // If the pre-rendered file doesn't exist, render it on the fly
    const { DefaultOG } = await import('../lib/og/render-default.js');
    return await renderOgImage(DefaultOG());
  }
  return Buffer.from(await file.arrayBuffer());
}

function pngResponse(
  c: { body: (data: unknown, init?: ResponseInit) => Response },
  png: Buffer,
  cacheControl: string,
  renderTimeMs?: number,
): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'image/png',
    'Cache-Control': cacheControl,
  };
  if (renderTimeMs !== undefined) {
    headers['X-Render-Time'] = `${Math.round(renderTimeMs)}ms`;
  }
  return c.body(png, { headers });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const ogRouter = new Hono();

/**
 * GET /constitution/:id -- dynamic OG image for a specific constitution.
 */
ogRouter.get('/constitution/:id', async (c) => {
  const id = c.req.param('id');

  // Validate UUID format
  if (!isValidUUID(id)) {
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

    // Not found: return default image (not 404!)
    if (!record) {
      const defaultPng = await getDefaultOgImage();
      return pngResponse(
        c,
        defaultPng,
        'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      );
    }

    // Found: render constitution card
    const traditions = record.tradition_sections as Record<string, string> | null;
    const props = {
      summary: record.plain_language_summary ?? 'Your Triveda Constitution',
      traditionSummaries: {
        ayurveda: traditions?.ayurveda ?? '',
        tcm: traditions?.tcm ?? '',
        naturopathy: traditions?.naturopathy ?? '',
      },
    };

    const startTime = performance.now();
    const png = await renderOgImage(ConstitutionCardOG(props));
    const renderTimeMs = performance.now() - startTime;

    return pngResponse(
      c,
      png,
      'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      renderTimeMs,
    );
  } catch (err) {
    // Any error: log and return default (never 500)
    console.error('[og] Error rendering constitution OG image:', err);
    try {
      const defaultPng = await getDefaultOgImage();
      return pngResponse(c, defaultPng, 'public, max-age=3600, s-maxage=86400');
    } catch (fallbackErr) {
      // Even the default image failed -- return a minimal 1x1 transparent PNG
      console.error('[og] Default image fallback also failed:', fallbackErr);
      const minimalPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      );
      return pngResponse(c, minimalPng, 'public, max-age=60');
    }
  }
});

/**
 * GET /default -- static default OG image.
 */
ogRouter.get('/default', async (c) => {
  try {
    const defaultPng = await getDefaultOgImage();
    return pngResponse(c, defaultPng, 'public, max-age=604800, s-maxage=31536000, immutable');
  } catch (err) {
    console.error('[og] Error serving default OG image:', err);
    const minimalPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );
    return pngResponse(c, minimalPng, 'public, max-age=60');
  }
});

export { ogRouter };
