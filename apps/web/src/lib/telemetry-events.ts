/**
 * Client-side telemetry event helpers for the share flow.
 *
 * All tracking is fire-and-forget. Failed requests are logged to console
 * but never surface errors to the user.
 */

type SharePlatform = 'native' | 'clipboard' | 'twitter' | 'linkedin' | 'instagram';

function getBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
}

function fireAndForget(payload: Record<string, unknown>): void {
  try {
    fetch(`${getBaseUrl()}/api/v1/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.error('[telemetry] Failed to send event:', err);
    });
  } catch (err) {
    console.error('[telemetry] Failed to send event:', err);
  }
}

export function trackShareInitiated(constitutionId: string, platform: SharePlatform): void {
  fireAndForget({
    event_type: 'share_initiated',
    constitution_id: constitutionId,
    platform,
    timestamp: new Date().toISOString(),
  });
}

export function trackShareCompleted(constitutionId: string): void {
  fireAndForget({
    event_type: 'share_completed',
    constitution_id: constitutionId,
    timestamp: new Date().toISOString(),
  });
}
