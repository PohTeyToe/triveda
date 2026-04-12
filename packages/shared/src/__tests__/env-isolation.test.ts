import { beforeEach, describe, expect, it } from 'vitest';
import { _resetApiEnvCache } from '../env/api.js';

/** Remove a key from process.env (assignment to undefined stringifies it). */
function unsetEnv(key: string): void {
  Reflect.deleteProperty(process.env, key);
}

describe('env isolation', () => {
  beforeEach(() => {
    _resetApiEnvCache();
  });

  it('importing @triveda/shared does NOT trigger apiEnv validation', async () => {
    // Remove all server-only env vars so apiEnv validation would fail
    const saved = {
      DATABASE_URL: process.env.DATABASE_URL,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
    unsetEnv('DATABASE_URL');
    unsetEnv('SUPABASE_URL');
    unsetEnv('SUPABASE_SERVICE_ROLE_KEY');

    // Importing the barrel should NOT throw
    const shared = await import('../index.js');
    expect(shared).toBeDefined();
    expect(shared.ALL_FEATURE_IDS).toHaveLength(22);

    // But calling getApiEnv without server env vars SHOULD throw
    expect(() => shared.apiEnv.getApiEnv()).toThrow();

    // Restore
    if (saved.DATABASE_URL) process.env.DATABASE_URL = saved.DATABASE_URL;
    if (saved.SUPABASE_URL) process.env.SUPABASE_URL = saved.SUPABASE_URL;
    if (saved.SUPABASE_SERVICE_ROLE_KEY)
      process.env.SUPABASE_SERVICE_ROLE_KEY = saved.SUPABASE_SERVICE_ROLE_KEY;
  });
});
