-- 0001: Enable required PostgreSQL extensions.
-- Hand-written (not drizzle-kit managed). Safe to re-run.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
