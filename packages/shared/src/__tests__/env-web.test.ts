import { beforeEach, describe, expect, it } from 'vitest';
import { _resetWebEnvCache, getWebEnv } from '../env/web.js';

/** Remove a key from process.env (assignment to undefined stringifies it). */
function unsetEnv(key: string): void {
  Reflect.deleteProperty(process.env, key);
}

describe('getWebEnv', () => {
  beforeEach(() => {
    _resetWebEnvCache();
    // Ensure no leftover env from other tests
    unsetEnv('VITE_SUPABASE_URL');
    unsetEnv('VITE_SUPABASE_ANON_KEY');
    unsetEnv('VITE_API_URL');
    unsetEnv('VITE_ENABLE_DEMO_MODE');
  });

  it('validates and returns typed object with valid env vars', () => {
    process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.VITE_API_URL = 'https://api.triveda.app';
    process.env.VITE_ENABLE_DEMO_MODE = 'true';

    const env = getWebEnv();

    expect(env.VITE_SUPABASE_URL).toBe('https://test.supabase.co');
    expect(env.VITE_SUPABASE_ANON_KEY).toBe('test-anon-key');
    expect(env.VITE_API_URL).toBe('https://api.triveda.app');
    expect(env.VITE_ENABLE_DEMO_MODE).toBe(true);
  });

  it('defaults VITE_ENABLE_DEMO_MODE to false', () => {
    process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.VITE_API_URL = 'https://api.triveda.app';

    const env = getWebEnv();
    expect(env.VITE_ENABLE_DEMO_MODE).toBe(false);
  });

  it('throws readable error when VITE_SUPABASE_URL is missing', () => {
    process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.VITE_API_URL = 'https://api.triveda.app';

    expect(() => getWebEnv()).toThrow(/VITE_SUPABASE_URL/);
  });
});
