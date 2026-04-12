/**
 * Common math operations for deterministic engines.
 *
 * Pure functions -- no IO or side effects.
 */

/**
 * Normalize a record of numeric values so they sum to 1.0.
 *
 * If all values are zero, returns equal distribution (1/n for each key).
 * Preserves key order.
 */
export function normalize(values: Record<string, number>): Record<string, number> {
  const entries = Object.entries(values);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  if (total === 0) {
    const equal = 1 / entries.length;
    return Object.fromEntries(entries.map(([k]) => [k, equal]));
  }

  return Object.fromEntries(entries.map(([k, v]) => [k, v / total]));
}

/**
 * Return the most frequent string in an array.
 *
 * On a tie, returns the first occurrence among the tied values.
 */
export function mode(values: string[]): string {
  const counts = new Map<string, number>();
  const firstSeen = new Map<string, number>();

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v === undefined) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
    if (!firstSeen.has(v)) {
      firstSeen.set(v, i);
    }
  }

  let bestValue = values[0] ?? '';
  let bestCount = 0;
  let bestFirst = Number.POSITIVE_INFINITY;

  for (const [v, count] of counts) {
    const first = firstSeen.get(v) ?? Number.POSITIVE_INFINITY;
    if (count > bestCount || (count === bestCount && first < bestFirst)) {
      bestValue = v;
      bestCount = count;
      bestFirst = first;
    }
  }

  return bestValue;
}

/**
 * Linearly interpolate a value from one range to another.
 *
 * Maps `value` in [fromLow, fromHigh] to the corresponding position
 * in [toLow, toHigh]. Does not clamp -- values outside the source
 * range extrapolate linearly.
 */
export function linearInterpolate(
  value: number,
  fromLow: number,
  fromHigh: number,
  toLow: number,
  toHigh: number,
): number {
  const ratio = (value - fromLow) / (fromHigh - fromLow);
  return toLow + ratio * (toHigh - toLow);
}
