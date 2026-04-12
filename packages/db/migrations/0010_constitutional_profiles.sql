-- 0010: Constitutional profiles table.
-- Stores dosha quiz answers and computed profile for each user.
-- Migration range 0010-0019 reserved for user-scoped tables.

CREATE TABLE IF NOT EXISTS "constitutional_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL UNIQUE,
  "dosha_ratios" jsonb NOT NULL,
  "element_type" text,
  "plain_language_summary" text NOT NULL,
  "tradition_sections" jsonb NOT NULL,
  "answers" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "answer_count" smallint NOT NULL DEFAULT 0,
  "completeness" smallint NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint

-- RLS: users can only manage their own constitutional profile
ALTER TABLE "constitutional_profiles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "Users can manage own constitutional_profiles" ON "constitutional_profiles"
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
