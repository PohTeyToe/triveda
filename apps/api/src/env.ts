import { z } from 'zod';

/**
 * Environment schema for the API server.
 * In demo mode, database/Supabase vars are optional.
 */

const demoSchema = z.object({
  PORT: z.coerce.number().default(3001),
  DEMO_MODE: z.literal('true'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

const productionSchema = z.object({
  PORT: z.coerce.number().default(3001),
  DEMO_MODE: z.enum(['false', '']).optional().default('false'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().optional(),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required in non-demo mode'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required in non-demo mode'),
});

export interface Env {
  PORT: number;
  DEMO_MODE: boolean;
  NODE_ENV: 'development' | 'production' | 'test';
  CORS_ORIGIN?: string;
  DATABASE_URL?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

let _env: Env | null = null;

/**
 * Validate and return environment variables.
 * Crashes with a readable error if required vars are missing.
 * Result is cached after first call.
 */
export function getApiEnv(): Env {
  if (_env) return _env;

  const raw = {
    PORT: process.env.PORT,
    DEMO_MODE: process.env.DEMO_MODE,
    NODE_ENV: process.env.NODE_ENV,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

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
      CORS_ORIGIN: result.data.CORS_ORIGIN,
      DATABASE_URL: result.data.DATABASE_URL,
      SUPABASE_URL: result.data.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: result.data.SUPABASE_SERVICE_ROLE_KEY,
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
      CORS_ORIGIN: result.data.CORS_ORIGIN,
      DATABASE_URL: result.data.DATABASE_URL,
      SUPABASE_URL: result.data.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: result.data.SUPABASE_SERVICE_ROLE_KEY,
    };
  }

  return _env;
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
