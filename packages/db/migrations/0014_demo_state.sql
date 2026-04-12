-- 0014: Demo state table.
-- Tracks demo progression (current day, cached recommendations) per user.

CREATE TABLE IF NOT EXISTS "demo_state" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL UNIQUE,
  "current_day" smallint NOT NULL DEFAULT 1,
  "recommendations" jsonb DEFAULT '[]'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint

-- RLS: users can only manage their own demo state
ALTER TABLE "demo_state" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "Users can manage own demo_state" ON "demo_state"
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
