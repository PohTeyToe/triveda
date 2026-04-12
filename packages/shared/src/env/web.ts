import { z } from 'zod';

/**
 * Zod schema for web (Vite) environment variables.
 *
 * Reads from `import.meta.env` in Vite or falls back to `process.env`
 * for test environments.
 */
const webEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),
  VITE_API_URL: z.string().url('VITE_API_URL must be a valid URL'),
  VITE_ENABLE_DEMO_MODE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

let cached: WebEnv | null = null;

/**
 * Lazily validate and return web environment variables.
 *
 * Validation only runs on the first call; subsequent calls return the
 * cached result. Throws a ZodError naming the specific missing or
 * invalid variable(s) if validation fails.
 */
export function getWebEnv(): WebEnv {
  if (cached) return cached;

  // In Vite, import.meta.env is available. In tests, fall back to process.env.
  const source =
    typeof globalThis !== 'undefined' &&
    'import' in globalThis &&
    typeof (globalThis as Record<string, unknown>).import === 'object'
      ? ((globalThis as Record<string, unknown>).import as Record<string, unknown>).meta
      : typeof process !== 'undefined'
        ? process.env
        : {};

  cached = webEnvSchema.parse(source);
  return cached;
}

/**
 * Reset the cached env (useful for tests).
 * @internal
 */
export function _resetWebEnvCache(): void {
  cached = null;
}
