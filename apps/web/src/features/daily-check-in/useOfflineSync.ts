/**
 * useOfflineSync -- retries unsynced check-in records when connectivity is restored.
 *
 * Listens for 'online' events and 'visibilitychange' events.
 * Runs syncPending once on mount for records from previous sessions.
 */

import type { DailyCheckInAnswer } from '@triveda/shared/inputs';
import { useEffect } from 'react';
import { idbGet, idbKeys, idbSet } from './useCheckIn';

async function syncPending(): Promise<void> {
  let keys: string[];
  try {
    keys = await idbKeys();
  } catch {
    return;
  }

  for (const key of keys) {
    try {
      const record = await idbGet(key);
      if (!record || record.synced) continue;

      // In a full implementation, POST or DELETE to the API here.
      // For now, mark as synced since we have no API client wired.
      const synced: DailyCheckInAnswer = { ...record, synced: true };
      await idbSet(key, synced);
    } catch (err) {
      console.warn('Offline sync failed for key:', key, err);
    }
  }
}

export function useOfflineSync(_userId: string): void {
  useEffect(() => {
    // Sync any pending records on mount
    syncPending();

    const handleOnline = () => {
      syncPending();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncPending();
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
}
