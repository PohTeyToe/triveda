/**
 * useDocumentTitle -- set the browser tab title.
 *
 * Appends " - Triveda" suffix if not already present.
 * Empty string falls back to "Triveda".
 */

import { useEffect } from 'react';

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    if (!title || title.trim().length === 0) {
      document.title = 'Triveda';
      return;
    }

    if (title.includes('Triveda')) {
      document.title = title;
    } else {
      document.title = `${title} - Triveda`;
    }
  }, [title]);
}
