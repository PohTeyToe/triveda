/**
 * PHI-redaction hook for telemetry payloads.
 *
 * Strips numeric values whose keys suggest biomarker readings and
 * numeric-looking strings that are not in the allowlist.
 */

const VALUE_KEY_SUBSTRINGS = ['value', 'result', 'reading', 'level', 'concentration'];

const ALLOWLIST_KEYS = new Set([
  'confidence',
  'count',
  'total',
  'id',
  'job_id',
  'report_id',
  'user_id',
  'page_count',
  'file_size_bytes',
  'duration_ms',
  'biomarker_count',
  'status',
  'stage',
  'vendor',
  'reason',
  'method',
  'fileName',
  'fileSize',
  'userId',
  'jobId',
  'reportId',
]);

const NUMERIC_STRING_PATTERN = /^-?\d+(?:\.\d+)?(\s*[a-zA-Z\/%^0-9]+)?$/;

function isValueKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (ALLOWLIST_KEYS.has(key) || ALLOWLIST_KEYS.has(lower)) return false;
  return VALUE_KEY_SUBSTRINGS.some((s) => lower.includes(s));
}

function redactValue(value: unknown, key: string): unknown {
  if (value === null || value === undefined) return value;

  if (isValueKey(key)) {
    if (typeof value === 'number') return '[REDACTED]';
    if (typeof value === 'string' && NUMERIC_STRING_PATTERN.test(value)) return '[REDACTED]';
  }

  if (
    typeof value === 'string' &&
    !ALLOWLIST_KEYS.has(key) &&
    !ALLOWLIST_KEYS.has(key.toLowerCase())
  ) {
    // Secondary heuristic: if a string field in an unknown key parses as a
    // biomarker-style value, redact.
    if (NUMERIC_STRING_PATTERN.test(value) && !/^\d{4}-\d{2}-\d{2}/.test(value)) {
      // Allow pure integer counts under 100 (e.g. page counts, indexes).
      const n = Number(value);
      if (!Number.isInteger(n) || Math.abs(n) >= 100) {
        return '[REDACTED]';
      }
    }
  }

  return value;
}

export function redactPhi(payload: unknown): unknown {
  if (payload === null || payload === undefined) return payload;

  if (Array.isArray(payload)) {
    return payload.map((item) => redactPhi(item));
  }

  if (typeof payload === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
      if (v !== null && typeof v === 'object') {
        out[k] = redactPhi(v);
      } else {
        out[k] = redactValue(v, k);
      }
    }
    return out;
  }

  return payload;
}
