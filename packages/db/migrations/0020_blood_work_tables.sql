-- Blood work tables: reports, biomarkers, and review queue.
-- Migration range 0020-0029 reserved for split 10 (blood work input).

CREATE TABLE "blood_work_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "job_id" uuid UNIQUE NOT NULL,
  "vendor" text,
  "status" text NOT NULL DEFAULT 'pending',
  "stage" text,
  "file_name" text NOT NULL,
  "file_size_bytes" integer NOT NULL,
  "page_count" integer,
  "extraction_method" text,
  "error_message" text,
  "food_influences" jsonb,
  "uploaded_at" timestamptz NOT NULL DEFAULT now(),
  "started_at" timestamptz,
  "processed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "blood_work_biomarkers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "report_id" uuid NOT NULL REFERENCES "blood_work_reports"("id") ON DELETE CASCADE,
  "canonical_key" text NOT NULL,
  "display_name" text NOT NULL,
  "value" numeric NOT NULL,
  "unit" text NOT NULL,
  "original_unit" text,
  "reference_range_low" numeric,
  "reference_range_high" numeric,
  "flag" text NOT NULL,
  "confidence" numeric(3, 2) NOT NULL,
  "loinc_code" text,
  "extraction_notes" text,
  "manually_corrected" boolean NOT NULL DEFAULT false,
  "corrected_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "blood_work_review_queue" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "biomarker_id" uuid NOT NULL UNIQUE REFERENCES "blood_work_biomarkers"("id") ON DELETE CASCADE,
  "report_id" uuid NOT NULL REFERENCES "blood_work_reports"("id") ON DELETE CASCADE,
  "reason" text NOT NULL,
  "resolved" boolean NOT NULL DEFAULT false,
  "resolved_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "blood_work_reports_user_id_idx" ON "blood_work_reports" ("user_id");
--> statement-breakpoint
CREATE INDEX "blood_work_reports_job_id_idx" ON "blood_work_reports" ("job_id");
--> statement-breakpoint
CREATE INDEX "blood_work_biomarkers_report_id_idx" ON "blood_work_biomarkers" ("report_id");
--> statement-breakpoint
CREATE INDEX "blood_work_biomarkers_canonical_key_idx" ON "blood_work_biomarkers" ("canonical_key");
--> statement-breakpoint
CREATE INDEX "blood_work_review_queue_report_id_idx" ON "blood_work_review_queue" ("report_id");
--> statement-breakpoint

-- RLS policies for blood_work_reports
ALTER TABLE "blood_work_reports" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "blood_work_reports_select" ON "blood_work_reports"
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));
--> statement-breakpoint
CREATE POLICY "blood_work_reports_insert" ON "blood_work_reports"
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));
--> statement-breakpoint
CREATE POLICY "blood_work_reports_update" ON "blood_work_reports"
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()));
--> statement-breakpoint
CREATE POLICY "blood_work_reports_delete" ON "blood_work_reports"
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));
--> statement-breakpoint

-- RLS policies for blood_work_biomarkers
ALTER TABLE "blood_work_biomarkers" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "blood_work_biomarkers_select" ON "blood_work_biomarkers"
  FOR SELECT TO authenticated
  USING (report_id IN (SELECT id FROM blood_work_reports WHERE user_id = (select auth.uid())));
--> statement-breakpoint
CREATE POLICY "blood_work_biomarkers_insert" ON "blood_work_biomarkers"
  FOR INSERT TO authenticated
  WITH CHECK (report_id IN (SELECT id FROM blood_work_reports WHERE user_id = (select auth.uid())));
--> statement-breakpoint
CREATE POLICY "blood_work_biomarkers_update" ON "blood_work_biomarkers"
  FOR UPDATE TO authenticated
  USING (report_id IN (SELECT id FROM blood_work_reports WHERE user_id = (select auth.uid())));
--> statement-breakpoint
CREATE POLICY "blood_work_biomarkers_delete" ON "blood_work_biomarkers"
  FOR DELETE TO authenticated
  USING (report_id IN (SELECT id FROM blood_work_reports WHERE user_id = (select auth.uid())));
--> statement-breakpoint

-- RLS policies for blood_work_review_queue
ALTER TABLE "blood_work_review_queue" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "blood_work_review_queue_select" ON "blood_work_review_queue"
  FOR SELECT TO authenticated
  USING (report_id IN (SELECT id FROM blood_work_reports WHERE user_id = (select auth.uid())));
--> statement-breakpoint
CREATE POLICY "blood_work_review_queue_insert" ON "blood_work_review_queue"
  FOR INSERT TO authenticated
  WITH CHECK (report_id IN (SELECT id FROM blood_work_reports WHERE user_id = (select auth.uid())));
--> statement-breakpoint
CREATE POLICY "blood_work_review_queue_update" ON "blood_work_review_queue"
  FOR UPDATE TO authenticated
  USING (report_id IN (SELECT id FROM blood_work_reports WHERE user_id = (select auth.uid())));
--> statement-breakpoint
CREATE POLICY "blood_work_review_queue_delete" ON "blood_work_review_queue"
  FOR DELETE TO authenticated
  USING (report_id IN (SELECT id FROM blood_work_reports WHERE user_id = (select auth.uid())));
--> statement-breakpoint

-- Storage bucket RLS for blood-work uploads
CREATE POLICY "users_upload_own_blood_work"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'blood-work'
  AND (storage.foldername(name))[1] = (select auth.uid()::text)
);
--> statement-breakpoint
CREATE POLICY "users_read_own_blood_work"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'blood-work'
  AND (storage.foldername(name))[1] = (select auth.uid()::text)
);
--> statement-breakpoint
CREATE POLICY "users_delete_own_blood_work"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'blood-work'
  AND (storage.foldername(name))[1] = (select auth.uid()::text)
);
