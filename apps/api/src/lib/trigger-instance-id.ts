/**
 * Build a deterministic trigger instance ID from user, type, and matching check-ins.
 *
 * The instance ID is stable across consecutive days as long as the same
 * earliest check-in is in the matching window. When the earliest check-in
 * ages out, the ID changes -- this is correct because it represents a new
 * trigger instance.
 */

import type { DailyCheckIn } from '@triveda/shared';

/**
 * Build a deterministic trigger instance ID.
 * Uses FNV-1a hash for compactness.
 */
export function buildTriggerInstanceId(
  userId: string,
  triggerType: string,
  matchingCheckIns: DailyCheckIn[],
): string {
  // Sort by date ascending to get the earliest
  const sorted = [...matchingCheckIns].sort((a, b) => a.date.localeCompare(b.date));
  const earliestDate = sorted[0]?.date ?? 'unknown';
  const input = `${userId}:${triggerType}:${earliestDate}`;
  return fnv1aHex(input);
}

/**
 * FNV-1a hash producing a hex string.
 * Simple non-cryptographic hash for deterministic instance IDs.
 */
function fnv1aHex(str: string): string {
  let hash = 0x811c9dc5; // FNV offset basis (32-bit)
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  // Convert to unsigned 32-bit and then to hex
  return (hash >>> 0).toString(16).padStart(8, '0');
}
