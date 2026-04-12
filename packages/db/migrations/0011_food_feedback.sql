-- 0011: Food feedback table.
-- Tracks user responses (tried/rejected) to food suggestions.

CREATE TABLE IF NOT EXISTS "food_feedback" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "suggestion_id" uuid NOT NULL,
  "response" text NOT NULL,
  "symptom_tag" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "food_feedback_user_suggestion_idx" UNIQUE ("user_id", "suggestion_id")
);
--> statement-breakpoint

-- RLS: users can only manage their own food feedback
ALTER TABLE "food_feedback" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "Users can manage own food_feedback" ON "food_feedback"
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
