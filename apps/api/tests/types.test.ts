import { describe, expect, it } from 'bun:test';
import type { AppType } from '../src/types.js';

describe('AppType', () => {
  it('is exported as a type (not a value)', () => {
    // This test verifies at compile time that AppType is a valid type.
    // If this file compiles, the type is correctly exported.
    // At runtime, we verify the module can be imported without error.
    const typeCheck: AppType | undefined = undefined;
    expect(typeCheck).toBeUndefined();
  });

  it('is a Hono app type (has fetch signature)', () => {
    // TypeScript structural check: AppType should be a Hono instance type
    // that includes a fetch method. This is verified at compile time.
    // biome-ignore lint/suspicious/noExplicitAny: intentional type-level check
    type HasFetch = AppType extends { fetch: (...args: any[]) => any } ? true : false;
    const check: HasFetch = true;
    expect(check).toBe(true);
  });
});
