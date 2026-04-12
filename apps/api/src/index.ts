import { app } from './app.js';
import { getApiEnv } from './env.js';

// Validate environment at boot
const env = getApiEnv();

const port = env.PORT;

console.log(`@triveda/api starting on port ${port} (demo=${env.DEMO_MODE}, env=${env.NODE_ENV})`);

export default {
  port,
  fetch: app.fetch,
};

// Re-export app for testing
export { app } from './app.js';
