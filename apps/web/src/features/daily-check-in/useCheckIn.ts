/**
 * useCheckIn -- manages check-in state with IndexedDB persistence.
 *
 * Uses a dedicated idb-keyval store ('triveda-checkins') to isolate
 * check-in data from other idb-keyval usage.
 *
 * Save is explicit (not auto-save). The user must tap "Save" to persist.
 */

import type { DailyCheckInAnswer } from '@triveda/shared/inputs';
import { useCallback, useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// IndexedDB helpers (inline to avoid idb-keyval dependency for now)
// ---------------------------------------------------------------------------

const DB_NAME = 'triveda-checkins';
const STORE_NAME = 'checkins';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet(key: string): Promise<DailyCheckInAnswer | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result as DailyCheckInAnswer | undefined);
    request.onerror = () => reject(request.error);
  });
}

async function idbSet(key: string, value: DailyCheckInAnswer): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbKeys(): Promise<string[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAllKeys();
    request.onsuccess = () => resolve(request.result as string[]);
    request.onerror = () => reject(request.error);
  });
}

// ---------------------------------------------------------------------------
// Local date helper (avoids locale-dependent toLocaleDateString)
// ---------------------------------------------------------------------------

function getLocalDateString(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export type UseCheckInReturn = {
  selections: Record<string, 'left' | 'right' | null>;
  isLoaded: boolean;
  isSynced: boolean;
  isDismissed: boolean;
  updateSelection: (pairId: string, value: 'left' | 'right' | null) => void;
  save: () => Promise<void>;
  dismiss: () => Promise<void>;
};

export function useCheckIn(userId: string): UseCheckInReturn {
  const [selections, setSelections] = useState<Record<string, 'left' | 'right' | null>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Load from IndexedDB on mount
  useEffect(() => {
    const key = `${userId}:${getLocalDateString()}`;

    idbGet(key)
      .then((stored) => {
        if (stored && stored.date === getLocalDateString()) {
          setSelections(stored.selections);
          setIsSynced(stored.synced);
          setIsDismissed(stored.dismissed);
        }
        setIsLoaded(true);
      })
      .catch(() => {
        setIsLoaded(true);
      });
  }, [userId]);

  const updateSelection = useCallback((pairId: string, value: 'left' | 'right' | null) => {
    setSelections((prev) => ({ ...prev, [pairId]: value }));
  }, []);

  const save = useCallback(async () => {
    const date = getLocalDateString();
    const key = `${userId}:${date}`;
    const answer: DailyCheckInAnswer = {
      date,
      selections,
      dismissed: false,
      synced: false,
    };

    try {
      await idbSet(key, answer);
    } catch {
      // IndexedDB write failed -- continue without persistence
    }

    // In a full implementation, POST to /daily-check-in here
    // On success: update synced = true in IndexedDB
    // For now, mark as synced optimistically
    try {
      const synced: DailyCheckInAnswer = { ...answer, synced: true };
      await idbSet(key, synced);
      setIsSynced(true);
    } catch {
      setIsSynced(false);
    }
  }, [userId, selections]);

  const dismiss = useCallback(async () => {
    const date = getLocalDateString();
    const key = `${userId}:${date}`;
    const answer: DailyCheckInAnswer = {
      date,
      selections: {},
      dismissed: true,
      synced: false,
    };

    try {
      await idbSet(key, answer);
      setIsDismissed(true);
    } catch {
      // Dismiss still works in-memory even if IndexedDB fails
      setIsDismissed(true);
    }
  }, [userId]);

  return { selections, isLoaded, isSynced, isDismissed, updateSelection, save, dismiss };
}

// Export for useOfflineSync
export { idbGet, idbSet, idbKeys, getLocalDateString };
