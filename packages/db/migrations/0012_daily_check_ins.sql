-- 0012: Daily check-ins table.
-- One check-in per user per date (mood, energy, digestion, sleep, symptoms).

CREATE TABLE IF NOT EXISTS "daily_check_ins" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "date" text NOT NULL,
  "mood" text NOT NULL,
  "energy" text NOT NULL,
  "digestion" text NOT NULL,
  "sleep_quality" text,
  "symptoms" text[],
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "daily_check_ins_user_date_idx" UNIQUE ("user_id", "date")
);
--> statement-breakpoint

-- RLS: users can only manage their own check-ins
ALTER TABLE "daily_check_ins" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "Users can manage own daily_check_ins" ON "daily_check_ins"
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
