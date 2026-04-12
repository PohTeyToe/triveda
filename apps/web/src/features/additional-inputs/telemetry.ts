/**
 * Telemetry event emitters for additional input pathways.
 *
 * Fire-and-forget -- never blocks the user flow. Every function wraps
 * in try/catch so telemetry failures never disrupt the experience.
 *
 * Event names use dot notation for easy category filtering.
 */

// Placeholder for the shared telemetry logger.
// In production this would import from a shared telemetry module
// that writes to the telemetry table.
function logTelemetry(event: string, payload: Record<string, unknown>): void {
  // Fire-and-forget write to telemetry table.
  // The actual implementation depends on the telemetry infrastructure
  // from the foundation split. For now, this is a no-op in production
  // and logs to console in development.
  if (import.meta.env.DEV) {
    console.debug('[telemetry]', event, payload);
  }
}

// ---------------------------------------------------------------------------
// Face scan events
// ---------------------------------------------------------------------------

export function logFaceScanStarted(userId: string, hasCamera: boolean): void {
  try {
    logTelemetry('face_scan.started', { userId, hasCamera });
  } catch (e) {
    console.warn('Telemetry write failed:', e);
  }
}

export function logFaceScanCaptured(userId: string, readingId: string, confidence: number): void {
  try {
    logTelemetry('face_scan.captured', { userId, readingId, confidence });
  } catch (e) {
    console.warn('Telemetry write failed:', e);
  }
}

export function logFaceScanSkipped(
  userId: string,
  reason: 'denied' | 'no_camera' | 'user_skip' | 'timeout',
): void {
  try {
    logTelemetry('face_scan.skipped', { userId, reason });
  } catch (e) {
    console.warn('Telemetry write failed:', e);
  }
}

// ---------------------------------------------------------------------------
// Check-in events
// ---------------------------------------------------------------------------

export function logCheckInSaved(
  userId: string,
  date: string,
  chipCount: number,
  chips: string[],
): void {
  try {
    logTelemetry('checkin.saved', { userId, date, chipCount, chips });
  } catch (e) {
    console.warn('Telemetry write failed:', e);
  }
}

export function logCheckInDismissed(userId: string, date: string): void {
  try {
    logTelemetry('checkin.dismissed', { userId, date });
  } catch (e) {
    console.warn('Telemetry write failed:', e);
  }
}

export function logCheckInSynced(userId: string, date: string, latencyMs: number): void {
  try {
    logTelemetry('checkin.synced', { userId, date, latencyMs });
  } catch (e) {
    console.warn('Telemetry write failed:', e);
  }
}

export function logCheckInSyncFailed(userId: string, date: string, error: string): void {
  try {
    logTelemetry('checkin.sync_failed', { userId, date, error });
  } catch (e) {
    console.warn('Telemetry write failed:', e);
  }
}

// ---------------------------------------------------------------------------
// Cultural matching events
// ---------------------------------------------------------------------------

export function logCulturalBonusApplied(
  userId: string,
  cuisineCode: string,
  foodId: string,
  weight: number,
): void {
  try {
    logTelemetry('cultural.bonus_applied', { userId, cuisineCode, foodId, weight });
  } catch (e) {
    console.warn('Telemetry write failed:', e);
  }
}
