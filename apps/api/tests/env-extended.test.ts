import { describe, expect, it } from 'bun:test';
import { parseEnv } from '../src/env.js';

/**
 * Build a complete valid production env for testing.
 * Individual tests override specific fields to trigger failures.
 */
function validProductionEnv(): Record<string, string | undefined> {
  return {
    PORT: '3001',
    DEMO_MODE: 'false',
    NODE_ENV: 'development',
    TRIVEDA_LLM_MODE: 'mock',
    DATABASE_URL: 'postgresql://localhost:5432/triveda',
    SUPABASE_URL: 'https://abc.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    SUPABASE_JWKS_URL: 'https://abc.supabase.co/auth/v1/.well-known/jwks.json',
    OPENWEATHER_API_KEY: 'test-weather-key',
  };
}

describe('parseEnv - production mode', () => {
  it('succeeds with all required vars present', () => {
    const env = parseEnv(validProductionEnv());
    expect(env.DEMO_MODE).toBe(false);
    expect(env.PORT).toBe(3001);
    expect(env.DATABASE_URL).toBe('postgresql://localhost:5432/triveda');
  });

  it('throws when DATABASE_URL is missing', () => {
    const raw = validProductionEnv();
    raw.DATABASE_URL = undefined;
    expect(() => parseEnv(raw)).toThrow('DATABASE_URL');
  });

  it('throws when DATABASE_URL does not start with postgres://', () => {
    const raw = validProductionEnv();
    raw.DATABASE_URL = 'mysql://localhost/db';
    expect(() => parseEnv(raw)).toThrow('postgres://');
  });

  it('accepts DATABASE_URL starting with postgres://', () => {
    const raw = validProductionEnv();
    raw.DATABASE_URL = 'postgres://localhost:5432/triveda';
    const env = parseEnv(raw);
    expect(env.DATABASE_URL).toBe('postgres://localhost:5432/triveda');
  });

  it('throws when SUPABASE_URL is missing', () => {
    const raw = validProductionEnv();
    raw.SUPABASE_URL = undefined;
    expect(() => parseEnv(raw)).toThrow('SUPABASE_URL');
  });

  it('throws when SUPABASE_JWKS_URL does not end with /jwks.json', () => {
    const raw = validProductionEnv();
    raw.SUPABASE_JWKS_URL = 'https://abc.supabase.co/auth/v1';
    expect(() => parseEnv(raw)).toThrow('jwks.json');
  });

  it('accepts SUPABASE_JWKS_URL ending with /jwks.json', () => {
    const raw = validProductionEnv();
    raw.SUPABASE_JWKS_URL = 'https://abc.supabase.co/custom/jwks.json';
    const env = parseEnv(raw);
    expect(env.SUPABASE_JWKS_URL).toBe('https://abc.supabase.co/custom/jwks.json');
  });

  it('accepts SUPABASE_JWKS_URL ending with /.well-known/jwks.json', () => {
    const raw = validProductionEnv();
    raw.SUPABASE_JWKS_URL = 'https://abc.supabase.co/auth/v1/.well-known/jwks.json';
    const env = parseEnv(raw);
    expect(env.SUPABASE_JWKS_URL).toContain('/.well-known/jwks.json');
  });

  it('throws when SUPABASE_ANON_KEY is missing', () => {
    const raw = validProductionEnv();
    raw.SUPABASE_ANON_KEY = undefined;
    expect(() => parseEnv(raw)).toThrow('SUPABASE_ANON_KEY');
  });

  it('throws when OPENWEATHER_API_KEY is missing', () => {
    const raw = validProductionEnv();
    raw.OPENWEATHER_API_KEY = undefined;
    expect(() => parseEnv(raw)).toThrow('OPENWEATHER_API_KEY');
  });

  it('sets PORT default to 3001 when not specified', () => {
    const raw = validProductionEnv();
    raw.PORT = undefined;
    const env = parseEnv(raw);
    expect(env.PORT).toBe(3001);
  });

  it('sets NODE_ENV default to development when not specified', () => {
    const raw = validProductionEnv();
    raw.NODE_ENV = undefined;
    const env = parseEnv(raw);
    expect(env.NODE_ENV).toBe('development');
  });

  it('rejects PORT outside 1-65535 range (too high)', () => {
    const raw = validProductionEnv();
    raw.PORT = '70000';
    expect(() => parseEnv(raw)).toThrow();
  });

  it('rejects PORT outside 1-65535 range (zero)', () => {
    const raw = validProductionEnv();
    raw.PORT = '0';
    expect(() => parseEnv(raw)).toThrow();
  });

  it('rejects invalid NODE_ENV value', () => {
    const raw = validProductionEnv();
    raw.NODE_ENV = 'staging';
    expect(() => parseEnv(raw)).toThrow();
  });
});

describe('parseEnv - LLM mode', () => {
  it('does not require ANTHROPIC_API_KEY in mock mode', () => {
    const raw = validProductionEnv();
    raw.TRIVEDA_LLM_MODE = 'mock';
    raw.ANTHROPIC_API_KEY = undefined;
    const env = parseEnv(raw);
    expect(env.TRIVEDA_LLM_MODE).toBe('mock');
  });

  it('requires ANTHROPIC_API_KEY in live mode', () => {
    const raw = validProductionEnv();
    raw.TRIVEDA_LLM_MODE = 'live';
    raw.ANTHROPIC_API_KEY = undefined;
    expect(() => parseEnv(raw)).toThrow('ANTHROPIC_API_KEY');
  });

  it('succeeds in live mode with ANTHROPIC_API_KEY present', () => {
    const raw = validProductionEnv();
    raw.TRIVEDA_LLM_MODE = 'live';
    raw.ANTHROPIC_API_KEY = 'sk-ant-test-key';
    const env = parseEnv(raw);
    expect(env.TRIVEDA_LLM_MODE).toBe('live');
    expect(env.ANTHROPIC_API_KEY).toBe('sk-ant-test-key');
  });

  it('defaults TRIVEDA_LLM_MODE to live in production', () => {
    const raw = validProductionEnv();
    raw.TRIVEDA_LLM_MODE = undefined;
    raw.ANTHROPIC_API_KEY = 'sk-ant-test-key';
    const env = parseEnv(raw);
    expect(env.TRIVEDA_LLM_MODE).toBe('live');
  });
});

describe('parseEnv - demo mode', () => {
  it('succeeds with minimal demo config', () => {
    const env = parseEnv({ DEMO_MODE: 'true' });
    expect(env.DEMO_MODE).toBe(true);
    expect(env.PORT).toBe(3001);
    expect(env.NODE_ENV).toBe('development');
    expect(env.TRIVEDA_LLM_MODE).toBe('mock');
  });

  it('does not require any DB/Supabase vars in demo mode', () => {
    const env = parseEnv({ DEMO_MODE: 'true' });
    expect(env.DATABASE_URL).toBeUndefined();
    expect(env.SUPABASE_URL).toBeUndefined();
    expect(env.SUPABASE_ANON_KEY).toBeUndefined();
    expect(env.SUPABASE_JWKS_URL).toBeUndefined();
    expect(env.OPENWEATHER_API_KEY).toBeUndefined();
  });

  it('error message includes the name of every missing required field', () => {
    const raw: Record<string, string> = {
      DEMO_MODE: 'false',
      NODE_ENV: 'development',
      TRIVEDA_LLM_MODE: 'mock',
      // All required fields missing
    };
    try {
      parseEnv(raw);
      expect(true).toBe(false);
    } catch (err) {
      const msg = (err as Error).message;
      expect(msg).toContain('DATABASE_URL');
      expect(msg).toContain('SUPABASE_URL');
      expect(msg).toContain('SUPABASE_ANON_KEY');
      expect(msg).toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(msg).toContain('SUPABASE_JWKS_URL');
      expect(msg).toContain('OPENWEATHER_API_KEY');
    }
  });
});

describe('parseEnv - CORS_PRODUCTION_ORIGIN', () => {
  it('accepts valid https origin', () => {
    const raw = validProductionEnv();
    raw.CORS_PRODUCTION_ORIGIN = 'https://triveda.app';
    const env = parseEnv(raw);
    expect(env.CORS_PRODUCTION_ORIGIN).toBe('https://triveda.app');
  });

  it('rejects non-https origin in production mode', () => {
    const raw = validProductionEnv();
    raw.CORS_PRODUCTION_ORIGIN = 'http://triveda.app';
    expect(() => parseEnv(raw)).toThrow();
  });

  it('is optional (defaults to undefined)', () => {
    const raw = validProductionEnv();
    raw.CORS_PRODUCTION_ORIGIN = undefined;
    const env = parseEnv(raw);
    expect(env.CORS_PRODUCTION_ORIGIN).toBeUndefined();
  });
});
