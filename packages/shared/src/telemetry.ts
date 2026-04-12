/**
 * TelemetryLogger interface.
 *
 * Implementations live in apps/web and apps/api -- the shared package
 * exports only this interface to keep it free of Supabase or transport
 * dependencies.
 */
export interface TelemetryLogger {
  log(
    level: 'info' | 'warn' | 'error',
    message: string,
    metadata?: Record<string, unknown>,
  ): Promise<void>;
}
