-- Telemetry table for request logging.
-- Server-internal: only service role can INSERT and SELECT.

CREATE TABLE IF NOT EXISTS telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text NOT NULL,
  user_id uuid,
  method text NOT NULL,
  path text NOT NULL,
  status_code integer NOT NULL,
  latency_ms integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_request_id
  ON telemetry (request_id);

CREATE INDEX IF NOT EXISTS idx_telemetry_user_id_created
  ON telemetry (user_id, created_at);

-- RLS: server-internal only
ALTER TABLE telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY telemetry_service_insert ON telemetry
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY telemetry_service_select ON telemetry
  FOR SELECT TO service_role
  USING (true);

-- No policies for authenticated or anon roles = no access.
