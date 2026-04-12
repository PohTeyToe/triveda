/**
 * Demo mode flag — when enabled, auth auto-authenticates as a demo user
 * and API calls return fixture data.
 */
export function isDemoMode(): boolean {
  return import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';
}
