-- 0015: Seasonal transition acknowledgements table.
-- Tracks which ritu transitions a user has acknowledged (prevents repeat prompts).

CREATE TABLE IF NOT EXISTS "seasonal_transition_acknowledgements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "from_ritu" text NOT NULL,
  "to_ritu" text NOT NULL,
  "acknowledged_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "seasonal_ack_user_transition_idx" UNIQUE ("user_id", "from_ritu", "to_ritu")
);
--> statement-breakpoint

-- RLS: users can only manage their own seasonal acknowledgements
ALTER TABLE "seasonal_transition_acknowledgements" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "Users can manage own seasonal_transition_acknowledgements" ON "seasonal_transition_acknowledgements"
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
