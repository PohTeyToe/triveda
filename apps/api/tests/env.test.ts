import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { getApiEnv, resetEnvCache } from '../src/env.js';

function clearEnvVar(key: string) {
  delete process.env[key];
}

describe('Environment validation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetEnvCache();
  });

  afterEach(() => {
    // Restore original env
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
    resetEnvCache();
  });

  it('succeeds in demo mode without DATABASE_URL', () => {
    process.env.DEMO_MODE = 'true';
    clearEnvVar('DATABASE_URL');
    clearEnvVar('SUPABASE_URL');
    clearEnvVar('SUPABASE_SERVICE_ROLE_KEY');

    const env = getApiEnv();
    expect(env.DEMO_MODE).toBe(true);
  });

  it('fails in non-demo mode without DATABASE_URL', () => {
    process.env.DEMO_MODE = 'false';
    clearEnvVar('DATABASE_URL');
    clearEnvVar('SUPABASE_URL');
    clearEnvVar('SUPABASE_SERVICE_ROLE_KEY');

    expect(() => getApiEnv()).toThrow('Environment validation failed');
  });

  it('includes missing var names in error message', () => {
    process.env.DEMO_MODE = 'false';
    clearEnvVar('DATABASE_URL');
    clearEnvVar('SUPABASE_URL');
    clearEnvVar('SUPABASE_SERVICE_ROLE_KEY');

    try {
      getApiEnv();
      expect(true).toBe(false); // should not reach here
    } catch (err) {
      const msg = (err as Error).message;
      expect(msg).toContain('DATABASE_URL');
    }
  });

  it('defaults PORT to 3001', () => {
    process.env.DEMO_MODE = 'true';
    clearEnvVar('PORT');

    const env = getApiEnv();
    expect(env.PORT).toBe(3001);
  });

  it('caches result after first call', () => {
    process.env.DEMO_MODE = 'true';
    const env1 = getApiEnv();
    const env2 = getApiEnv();
    expect(env1).toBe(env2); // same reference
  });
});
