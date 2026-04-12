import { beforeEach, describe, expect, it } from 'vitest';
import { _resetApiEnvCache, getApiEnv } from '../env/api.js';

/** Remove a key from process.env (assignment to undefined stringifies it). */
function unsetEnv(key: string): void {
  Reflect.deleteProperty(process.env, key);
}

describe('getApiEnv', () => {
  beforeEach(() => {
    _resetApiEnvCache();
    // Ensure no leftover env from other tests
    unsetEnv('DATABASE_URL');
    unsetEnv('SUPABASE_URL');
    unsetEnv('SUPABASE_SERVICE_ROLE_KEY');
    unsetEnv('DEMO_MODE');
    unsetEnv('PORT');
  });

  it('validates and returns typed object with valid env vars', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/triveda';
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.DEMO_MODE = 'true';
    process.env.PORT = '8080';

    const env = getApiEnv();

    expect(env.DATABASE_URL).toBe('postgresql://localhost:5432/triveda');
    expect(env.SUPABASE_URL).toBe('https://test.supabase.co');
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe('test-service-role-key');
    expect(env.DEMO_MODE).toBe(true);
    expect(env.PORT).toBe(8080);
  });

  it('defaults DEMO_MODE to false and PORT to 3000', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/triveda';
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

    const env = getApiEnv();
    expect(env.DEMO_MODE).toBe(false);
    expect(env.PORT).toBe(3000);
  });

  it('throws readable error when DATABASE_URL is missing', () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

    expect(() => getApiEnv()).toThrow(/DATABASE_URL/);
  });

  it('throws when DATABASE_URL does not start with postgres', () => {
    process.env.DATABASE_URL = 'mysql://localhost/triveda';
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

    expect(() => getApiEnv()).toThrow(/postgres/);
  });
});
