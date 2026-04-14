-- Extend telemetry table with event-type fields for client-emitted events.
-- Existing request-metrics rows (method/path/status/latency) remain;
-- client events populate event_type + payload instead.

ALTER TABLE telemetry
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS payload jsonb;

-- Request-metric columns become nullable so event rows can skip them.
ALTER TABLE telemetry
  ALTER COLUMN method DROP NOT NULL,
  ALTER COLUMN path DROP NOT NULL,
  ALTER COLUMN status_code DROP NOT NULL,
  ALTER COLUMN latency_ms DROP NOT NULL,
  ALTER COLUMN request_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_telemetry_event_type_created
  ON telemetry (event_type, created_at);
