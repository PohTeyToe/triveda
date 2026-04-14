/**
 * Vendor detection — first-match-wins ladder run against the first page
 * of extracted text. Case-insensitive.
 */

import type { VendorType } from './types.js';

interface VendorPattern {
  vendor: VendorType;
  pattern: RegExp;
}

const PATTERNS: VendorPattern[] = [
  { vendor: 'lifelabs', pattern: /lifelabs/i },
  { vendor: 'quest', pattern: /quest\s*diagnostics/i },
  { vendor: 'labcorp', pattern: /lab\s*corp|laboratory\s+corporation\s+of\s+america/i },
  {
    vendor: 'ahs',
    pattern: /alberta\s+health\s+services|(?:^|\s)ahs(?:\s|$)/i,
  },
];

export function detectVendor(firstPageText: string): VendorType {
  if (!firstPageText) return 'unknown';
  for (const { vendor, pattern } of PATTERNS) {
    if (pattern.test(firstPageText)) return vendor;
  }
  return 'unknown';
}
