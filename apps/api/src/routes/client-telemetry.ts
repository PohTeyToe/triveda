/**
 * Public client-side telemetry endpoint.
 *
 * POST /api/v1/telemetry -- fire-and-forget event log from the browser.
 * No auth required. Used by ShareButton / ShareModal to record:
 *   - share_initiated  { constitution_id, platform, timestamp }
 *   - share_completed  { constitution_id, timestamp }
 *   - og_image_rendered { constitution_id, render_time_ms, cache_hit }
 *
 * Accepts any JSON payload with an `event_type` string. Writes a row to the
 * `telemetry` table (event_type + payload columns) when the DB is available,
 * and always emits a structured stdout log as a backup. Failures never surface
 * to the client -- always returns 204 No Content.
 */

import { telemetry as telemetryTable } from '@triveda/db';
import { Hono } from 'hono';
import { getDb } from './helpers/db.js';

const ALLOWED_EVENT_TYPES = new Set(['share_initiated', 'share_completed', 'og_image_rendered']);

const clientTelemetry = new Hono();

clientTelemetry.post('/', async (c) => {
  try {
    const body = await c.req.json<Record<string, unknown>>();
    const eventType = typeof body.event_type === 'string' ? body.event_type : 'unknown';

    if (!ALLOWED_EVENT_TYPES.has(eventType)) {
      // Accept but drop unknown event types -- don't leak info to clients.
      return c.body(null, 204);
    }

    // Structured log. Railway log drain parses these by `type` field.
    console.log(
      JSON.stringify({
        type: 'client_telemetry',
        event_type: eventType,
        ...body,
      }),
    );

    // Fire-and-forget DB write. Never awaited -- response returns immediately.
    try {
      const db = getDb();
      const userId = typeof body.user_id === 'string' ? body.user_id : null;
      void db
        .insert(telemetryTable)
        .values({
          event_type: eventType,
          user_id: userId,
          payload: body,
          // legacy request-metric columns left null for event rows
        })
        .catch((err: unknown) => {
          console.error('client-telemetry DB insert failed:', (err as Error).message);
        });
    } catch (err) {
      // DB unavailable (demo mode, no DATABASE_URL) -- log-only is acceptable.
      console.error('client-telemetry DB unavailable:', (err as Error).message);
    }
  } catch {
    // Swallow all errors -- client telemetry is best-effort.
  }
  return c.body(null, 204);
});

export { clientTelemetry };
