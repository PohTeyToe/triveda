import { z } from 'zod';

/**
 * Zod schema for API (server-side) environment variables.
 *
 * Reads from `process.env` (Node / Bun).
 */
const apiEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine((v) => v.startsWith('postgres'), {
      message: 'DATABASE_URL must start with "postgres"',
    }),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  DEMO_MODE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  PORT: z
    .string()
    .default('3000')
    .transform((v) => Number(v)),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

let cached: ApiEnv | null = null;

/**
 * Lazily validate and return API environment variables.
 *
 * Validation only runs on the first call; subsequent calls return the
 * cached result. Throws a ZodError naming the specific missing or
 * invalid variable(s) if validation fails.
 */
export function getApiEnv(): ApiEnv {
  if (cached) return cached;
  cached = apiEnvSchema.parse(process.env);
  return cached;
}

/**
 * Reset the cached env (useful for tests).
 * @internal
 */
export function _resetApiEnvCache(): void {
  cached = null;
}
