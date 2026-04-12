/**
 * Telemetry middleware -- fire-and-forget request logging.
 *
 * Records method, path, status code, latency, user ID, and request ID
 * for every request. The DB insert is NOT awaited so it never affects
 * the HTTP response.
 *
 * Position in middleware stack: after route handlers, so it measures
 * full request processing time including auth and rate limiting.
 */

import { createMiddleware } from 'hono/factory';

export type TelemetryRow = {
  request_id: string;
  user_id: string | null;
  method: string;
  path: string;
  status_code: number;
  latency_ms: number;
};

/** Pluggable writer for telemetry rows. Defaults to console logging. */
export type TelemetryWriter = (row: TelemetryRow) => void;

let _writer: TelemetryWriter = (row) => {
  // Default: log to stdout in JSON format for structured logging
  console.log(JSON.stringify({ type: 'telemetry', ...row }));
};

/**
 * Set a custom telemetry writer (e.g., database insert).
 * Call this at boot time to wire up the DB writer.
 */
export function setTelemetryWriter(writer: TelemetryWriter): void {
  _writer = writer;
}

/**
 * Get the current telemetry writer (for testing).
 */
export function getTelemetryWriter(): TelemetryWriter {
  return _writer;
}

/**
 * Telemetry middleware. Records request metadata after the response is sent.
 */
export const telemetry = createMiddleware(async (c, next) => {
  const startTime = performance.now();

  await next();

  const latencyMs = Math.round(performance.now() - startTime);

  const user = c.get('user') as { id: string } | undefined;

  const row: TelemetryRow = {
    request_id: (c.get('requestId') as string) ?? 'unknown',
    user_id: user?.id ?? null,
    method: c.req.method,
    path: c.req.path,
    status_code: c.res.status,
    latency_ms: latencyMs,
  };

  // Fire-and-forget: never block the response
  try {
    _writer(row);
  } catch (err) {
    console.error('Telemetry write failed:', (err as Error).message);
  }
});
