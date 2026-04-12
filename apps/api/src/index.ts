import { closeAll } from '@triveda/db';
import { app } from './app.js';
import { getApiEnv } from './env.js';
import { weatherCache } from './lib/weather-cache.js';
import { resetJWKSCache } from './middleware/auth.js';

// Validate environment at boot
const env = getApiEnv();

const port = env.PORT;

console.log(`@triveda/api starting on port ${port} (demo=${env.DEMO_MODE}, env=${env.NODE_ENV})`);

// --- Graceful shutdown ---
let shuttingDown = false;

async function cleanup() {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log('SIGTERM received, starting graceful shutdown...');

  const shutdownTimeout = setTimeout(() => {
    console.error('Graceful shutdown timed out after 10s, forcing exit');
    process.exit(1);
  }, 10_000);

  // Clear intervals
  weatherCache.clear();
  resetJWKSCache();

  // Close database connections
  try {
    await closeAll();
  } catch (err) {
    console.error('Error closing database connections:', (err as Error).message);
  }

  clearTimeout(shutdownTimeout);
  console.log('Graceful shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

export default {
  port,
  fetch: app.fetch,
};

// Re-export app for testing
export { app } from './app.js';
