-- 0013: Face scan readings table.
-- Stores simulated face-scan dosha/element deltas per user per hour.

CREATE TABLE IF NOT EXISTS "face_scan_readings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "vata_delta" numeric(4, 3) NOT NULL,
  "pitta_delta" numeric(4, 3) NOT NULL,
  "kapha_delta" numeric(4, 3) NOT NULL,
  "wood_hint" numeric(4, 3) NOT NULL,
  "fire_hint" numeric(4, 3) NOT NULL,
  "earth_hint" numeric(4, 3) NOT NULL,
  "metal_hint" numeric(4, 3) NOT NULL,
  "water_hint" numeric(4, 3) NOT NULL,
  "stress_level" numeric(4, 3) NOT NULL,
  "skin_tone" text NOT NULL,
  "confidence" numeric(4, 3) NOT NULL,
  "simulated" boolean NOT NULL DEFAULT true,
  "seed_hour" integer NOT NULL,
  "generated_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "face_scan_readings_user_hour_idx" UNIQUE ("user_id", "seed_hour")
);
--> statement-breakpoint

-- RLS: users can only manage their own face scan readings
ALTER TABLE "face_scan_readings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "Users can manage own face_scan_readings" ON "face_scan_readings"
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
