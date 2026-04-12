/**
 * Share utility functions for building share URLs and platform-specific text.
 */

/** Build the canonical share URL for a constitution. */
export function buildShareUrl(constitutionId: string): string {
  const baseUrl = import.meta.env.VITE_APP_URL ?? 'https://triveda.vercel.app';
  return `${baseUrl}/c/${encodeURIComponent(constitutionId)}`;
}

/**
 * Build platform-optimized share text.
 * Each platform has different length constraints and tone.
 */
export function buildShareText(
  summary: string,
  platform: 'twitter' | 'linkedin' | 'native',
): string {
  const safeSummary = summary || 'my three-tradition constitutional profile';

  switch (platform) {
    case 'twitter': {
      // Under 240 chars total (leave room for URL auto-append)
      const maxLen = 200;
      const prefix = 'My three-tradition constitution: ';
      const remaining = maxLen - prefix.length;
      const truncated =
        safeSummary.length > remaining ? `${safeSummary.slice(0, remaining - 3)}...` : safeSummary;
      return `${prefix}${truncated}`;
    }
    case 'linkedin':
      return `I just discovered my unique constitution through Triveda's three-tradition wellness assessment. ${safeSummary}`;
    case 'native':
      return `My Triveda constitution: ${safeSummary}`;
  }
}

/** Build a Twitter/X intent URL. */
export function buildTwitterIntentUrl(text: string, url: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

/** Build a LinkedIn share URL. */
export function buildLinkedInShareUrl(url: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

/**
 * Attempt Instagram Story share via deep link scheme.
 * Returns true if Instagram likely opened, false otherwise.
 * Best-effort: the scheme is unreliable across platforms.
 */
export async function attemptInstagramStoryShare(url: string): Promise<boolean> {
  if (!isMobile()) return false;

  // Copy URL to clipboard so user has it regardless
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // Clipboard not available, continue anyway
  }

  // Attempt the scheme
  window.location.href = `instagram-stories://share?url=${encodeURIComponent(url)}`;

  // Wait 500ms to see if the page is still visible
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(false);
    }, 500);

    const onVisChange = () => {
      if (document.visibilityState === 'hidden') {
        clearTimeout(timer);
        document.removeEventListener('visibilitychange', onVisChange);
        resolve(true);
      }
    };

    document.addEventListener('visibilitychange', onVisChange);
  });
}

/** Check if the current device is mobile (for Instagram option visibility). */
export function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|Android/i.test(navigator.userAgent);
}
