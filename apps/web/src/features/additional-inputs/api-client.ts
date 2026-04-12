/**
 * API client wrapper for the three additional input pathways.
 *
 * Thin wrapper that validates inputs before sending and strips
 * client-only fields (synced) before API calls.
 */

import { isValidCuisineCode } from '@triveda/shared/cuisines';
import {
  type DailyCheckInAnswer,
  type FaceScanReading,
  FaceScanReadingSchema,
} from '@triveda/shared/inputs';

// ---------------------------------------------------------------------------
// Base URL helper
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  // In production, this comes from environment config.
  // For now, use a relative URL that the Vite proxy or prod server handles.
  return '/api/v1';
}

async function apiFetch(path: string, init: RequestInit): Promise<Response> {
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response;
}

// ---------------------------------------------------------------------------
// Face scan
// ---------------------------------------------------------------------------

export async function uploadFaceScan(reading: FaceScanReading): Promise<{ id: string }> {
  // Validate before sending to catch bugs early
  FaceScanReadingSchema.parse(reading);

  const response = await apiFetch('/face-scan', {
    method: 'POST',
    body: JSON.stringify(reading),
  });

  return response.json() as Promise<{ id: string }>;
}

export async function readFaceScan(id: string): Promise<FaceScanReading> {
  const response = await apiFetch(`/face-scan/${id}`, {
    method: 'GET',
  });

  const data = await response.json();
  return FaceScanReadingSchema.parse(data);
}

// ---------------------------------------------------------------------------
// Daily check-in
// ---------------------------------------------------------------------------

export async function saveDailyCheckIn(
  answer: DailyCheckInAnswer,
): Promise<{ success: boolean; timestamp: string }> {
  // Strip the synced field (client-only IndexedDB state)
  const { synced: _synced, ...payload } = answer;

  const response = await apiFetch('/daily-check-in', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.json() as Promise<{ success: boolean; timestamp: string }>;
}

export async function dismissDailyCheckIn(): Promise<void> {
  await apiFetch('/daily-check-in/today', {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// Cultural preferences
// ---------------------------------------------------------------------------

export async function updateCulturalPreferences(cuisines: string[]): Promise<void> {
  for (const code of cuisines) {
    if (!isValidCuisineCode(code)) {
      throw new Error(`Invalid cuisine: ${code}`);
    }
  }

  await apiFetch('/profile/cultural-preferences', {
    method: 'PATCH',
    body: JSON.stringify({ cuisines }),
  });
}
