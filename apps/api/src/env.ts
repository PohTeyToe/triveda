import { z } from 'zod';

/**
 * Environment schema for the API server.
 *
 * Two modes:
 * - Demo mode (DEMO_MODE=true): DB/Supabase/LLM vars are optional.
 * - Production mode: all required vars must be present with correct format.
 *
 * Split 06 additions: SUPABASE_ANON_KEY, SUPABASE_JWKS_URL,
 * OPENWEATHER_API_KEY, ANTHROPIC_API_KEY (conditional on LLM mode),
 * GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_CLOUD_PROJECT,
 * TRIVEDA_LLM_MODE, CORS_PRODUCTION_ORIGIN.
 */

const demoSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DEMO_MODE: z.literal('true'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  TRIVEDA_LLM_MODE: z.enum(['live', 'mock']).default('mock'),
  CORS_ORIGIN: z.string().optional(),
  CORS_PRODUCTION_ORIGIN: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_JWKS_URL: z.string().optional(),
  OPENWEATHER_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  GOOGLE_CLOUD_PROJECT: z.string().optional(),
});

const productionSchema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    DEMO_MODE: z.enum(['false', '']).optional().default('false'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    TRIVEDA_LLM_MODE: z.enum(['live', 'mock']).default('live'),
    CORS_ORIGIN: z.string().optional(),
    CORS_PRODUCTION_ORIGIN: z.string().startsWith('https://').optional(),
    DATABASE_URL: z
      .string()
      .min(1, 'DATABASE_URL is required in non-demo mode')
      .refine(
        (v) => v.startsWith('postgres://') || v.startsWith('postgresql://'),
        'DATABASE_URL must start with postgres:// or postgresql://',
      ),
    SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
    SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
    SUPABASE_SERVICE_ROLE_KEY: z
      .string()
      .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required in non-demo mode'),
    SUPABASE_JWKS_URL: z
      .string()
      .min(1, 'SUPABASE_JWKS_URL is required')
      .refine(
        (v) => v.endsWith('/jwks.json') || v.endsWith('/.well-known/jwks.json'),
        'SUPABASE_JWKS_URL must end with /jwks.json or /.well-known/jwks.json',
      ),
    OPENWEATHER_API_KEY: z.string().min(1, 'OPENWEATHER_API_KEY is required'),
    ANTHROPIC_API_KEY: z.string().optional(),
    GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
    GOOGLE_CLOUD_PROJECT: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.TRIVEDA_LLM_MODE === 'live') {
        return !!data.ANTHROPIC_API_KEY;
      }
      return true;
    },
    {
      message: 'ANTHROPIC_API_KEY is required when TRIVEDA_LLM_MODE is "live"',
      path: ['ANTHROPIC_API_KEY'],
    },
  );

export interface Env {
  PORT: number;
  DEMO_MODE: boolean;
  NODE_ENV: 'development' | 'production' | 'test';
  TRIVEDA_LLM_MODE: 'live' | 'mock';
  CORS_ORIGIN?: string;
  CORS_PRODUCTION_ORIGIN?: string;
  DATABASE_URL?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_JWKS_URL?: string;
  OPENWEATHER_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GOOGLE_APPLICATION_CREDENTIALS?: string;
  GOOGLE_CLOUD_PROJECT?: string;
}

let _env: Env | null = null;

const ENV_KEYS = [
  'PORT',
  'DEMO_MODE',
  'NODE_ENV',
  'TRIVEDA_LLM_MODE',
  'CORS_ORIGIN',
  'CORS_PRODUCTION_ORIGIN',
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWKS_URL',
  'OPENWEATHER_API_KEY',
  'ANTHROPIC_API_KEY',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'GOOGLE_CLOUD_PROJECT',
] as const;

/**
 * Validate and return environment variables.
 * Crashes with a readable error if required vars are missing.
 * Result is cached after first call.
 */
export function getApiEnv(): Env {
  if (_env) return _env;

  const raw: Record<string, string | undefined> = {};
  for (const key of ENV_KEYS) {
    raw[key] = process.env[key];
  }

  const isDemo = raw.DEMO_MODE === 'true';

  if (isDemo) {
    const result = demoSchema.safeParse(raw);
    if (!result.success) {
      throwValidationError(result.error);
    }
    _env = {
      PORT: result.data.PORT,
      DEMO_MODE: true,
      NODE_ENV: result.data.NODE_ENV,
      TRIVEDA_LLM_MODE: result.data.TRIVEDA_LLM_MODE,
      CORS_ORIGIN: result.data.CORS_ORIGIN,
      CORS_PRODUCTION_ORIGIN: result.data.CORS_PRODUCTION_ORIGIN,
      DATABASE_URL: result.data.DATABASE_URL,
      SUPABASE_URL: result.data.SUPABASE_URL,
      SUPABASE_ANON_KEY: result.data.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: result.data.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_JWKS_URL: result.data.SUPABASE_JWKS_URL,
      OPENWEATHER_API_KEY: result.data.OPENWEATHER_API_KEY,
      ANTHROPIC_API_KEY: result.data.ANTHROPIC_API_KEY,
      GOOGLE_APPLICATION_CREDENTIALS: result.data.GOOGLE_APPLICATION_CREDENTIALS,
      GOOGLE_CLOUD_PROJECT: result.data.GOOGLE_CLOUD_PROJECT,
    };
  } else {
    const result = productionSchema.safeParse(raw);
    if (!result.success) {
      throwValidationError(result.error);
    }
    _env = {
      PORT: result.data.PORT,
      DEMO_MODE: false,
      NODE_ENV: result.data.NODE_ENV,
      TRIVEDA_LLM_MODE: result.data.TRIVEDA_LLM_MODE,
      CORS_ORIGIN: result.data.CORS_ORIGIN,
      CORS_PRODUCTION_ORIGIN: result.data.CORS_PRODUCTION_ORIGIN,
      DATABASE_URL: result.data.DATABASE_URL,
      SUPABASE_URL: result.data.SUPABASE_URL,
      SUPABASE_ANON_KEY: result.data.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: result.data.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_JWKS_URL: result.data.SUPABASE_JWKS_URL,
      OPENWEATHER_API_KEY: result.data.OPENWEATHER_API_KEY,
      ANTHROPIC_API_KEY: result.data.ANTHROPIC_API_KEY,
      GOOGLE_APPLICATION_CREDENTIALS: result.data.GOOGLE_APPLICATION_CREDENTIALS,
      GOOGLE_CLOUD_PROJECT: result.data.GOOGLE_CLOUD_PROJECT,
    };
  }

  return _env;
}

/**
 * Pure function variant for testing -- takes an env-like object
 * instead of reading process.env. Does NOT cache.
 */
export function parseEnv(env: Record<string, string | undefined>): Env {
  const isDemo = env.DEMO_MODE === 'true';

  if (isDemo) {
    const result = demoSchema.safeParse(env);
    if (!result.success) {
      throwValidationError(result.error);
    }
    return {
      PORT: result.data.PORT,
      DEMO_MODE: true,
      NODE_ENV: result.data.NODE_ENV,
      TRIVEDA_LLM_MODE: result.data.TRIVEDA_LLM_MODE,
      CORS_ORIGIN: result.data.CORS_ORIGIN,
      CORS_PRODUCTION_ORIGIN: result.data.CORS_PRODUCTION_ORIGIN,
      DATABASE_URL: result.data.DATABASE_URL,
      SUPABASE_URL: result.data.SUPABASE_URL,
      SUPABASE_ANON_KEY: result.data.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: result.data.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_JWKS_URL: result.data.SUPABASE_JWKS_URL,
      OPENWEATHER_API_KEY: result.data.OPENWEATHER_API_KEY,
      ANTHROPIC_API_KEY: result.data.ANTHROPIC_API_KEY,
      GOOGLE_APPLICATION_CREDENTIALS: result.data.GOOGLE_APPLICATION_CREDENTIALS,
      GOOGLE_CLOUD_PROJECT: result.data.GOOGLE_CLOUD_PROJECT,
    };
  }

  const result = productionSchema.safeParse(env);
  if (!result.success) {
    throwValidationError(result.error);
  }
  return {
    PORT: result.data.PORT,
    DEMO_MODE: false,
    NODE_ENV: result.data.NODE_ENV,
    TRIVEDA_LLM_MODE: result.data.TRIVEDA_LLM_MODE,
    CORS_ORIGIN: result.data.CORS_ORIGIN,
    CORS_PRODUCTION_ORIGIN: result.data.CORS_PRODUCTION_ORIGIN,
    DATABASE_URL: result.data.DATABASE_URL,
    SUPABASE_URL: result.data.SUPABASE_URL,
    SUPABASE_ANON_KEY: result.data.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: result.data.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_JWKS_URL: result.data.SUPABASE_JWKS_URL,
    OPENWEATHER_API_KEY: result.data.OPENWEATHER_API_KEY,
    ANTHROPIC_API_KEY: result.data.ANTHROPIC_API_KEY,
    GOOGLE_APPLICATION_CREDENTIALS: result.data.GOOGLE_APPLICATION_CREDENTIALS,
    GOOGLE_CLOUD_PROJECT: result.data.GOOGLE_CLOUD_PROJECT,
  };
}

function throwValidationError(error: z.ZodError): never {
  const missing = error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(
    `Environment validation failed:\n${missing}\n\nSet DEMO_MODE=true to bypass database requirements.`,
  );
}

/**
 * Reset cached env (useful for testing).
 */
export function resetEnvCache(): void {
  _env = null;
}
