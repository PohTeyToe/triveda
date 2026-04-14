/**
 * Public client-side telemetry endpoint.
 *
 * POST /api/v1/telemetry -- fire-and-forget event log from the browser.
 * No auth required. Used by ShareButton / ShareModal to record:
 *   - share_initiated  { constitution_id, platform, timestamp }
 *   - share_completed  { constitution_id, timestamp }
 *
 * Accepts any JSON payload with an `event_type` string. Events are logged
 * to stdout in JSON (consumed by Railway log drains). Failures never surface
 * to the client -- always returns 204 No Content.
 */

import { Hono } from 'hono';

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
  } catch {
    // Swallow all errors -- client telemetry is best-effort.
  }
  return c.body(null, 204);
});

export { clientTelemetry };
