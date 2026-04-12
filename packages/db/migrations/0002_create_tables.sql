CREATE TABLE "biomarker_food_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"biomarker_name" text NOT NULL,
	"canonical_biomarker_key" text NOT NULL,
	"food_id" uuid NOT NULL,
	"effect_direction" text NOT NULL,
	"effect_magnitude" numeric(3, 2) NOT NULL,
	"mechanism" text,
	"citation" text NOT NULL,
	CONSTRAINT "biomarker_mappings_unique" UNIQUE("canonical_biomarker_key","food_id","effect_direction")
);
--> statement-breakpoint
CREATE TABLE "cultural_cuisines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cuisine" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"cultural_affinity" numeric(3, 2) NOT NULL,
	"prevalence_tag" text NOT NULL,
	CONSTRAINT "cultural_cuisines_unique" UNIQUE("cuisine","entity_type","entity_id")
);
--> statement-breakpoint
CREATE TABLE "data_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"source_name" text NOT NULL,
	"source_url" text,
	"source_version" text,
	"verification_date" date NOT NULL,
	"validator" text NOT NULL,
	"confidence_score" numeric(3, 2) NOT NULL,
	"disagreement_notes" text,
	"properties_covered" text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" uuid NOT NULL,
	"claim" text NOT NULL,
	"evidence_level" text NOT NULL,
	"source_citation" text NOT NULL,
	"pubmed_id" text
);
--> statement-breakpoint
CREATE TABLE "food_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"parent_category" text,
	"icon" text,
	"display_order" integer NOT NULL,
	"description" text,
	CONSTRAINT "food_categories_category_unique" UNIQUE("category")
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_sanskrit" text,
	"name_chinese" text,
	"category" text NOT NULL,
	"subcategory" text,
	"description" text,
	"rasa" text[] NOT NULL,
	"virya" text NOT NULL,
	"vipaka" text NOT NULL,
	"guna" text[] NOT NULL,
	"vata_effect" smallint NOT NULL,
	"pitta_effect" smallint NOT NULL,
	"kapha_effect" smallint NOT NULL,
	"ritu_fit" jsonb NOT NULL,
	"thermal_nature" text NOT NULL,
	"flavor" text[] NOT NULL,
	"organ_affinity" text[] NOT NULL,
	"actions" text[] NOT NULL,
	"element_fit" jsonb NOT NULL,
	"glycemic_index" smallint,
	"bioactive_compounds" jsonb,
	"contraindications" text[],
	"seed_source" text NOT NULL,
	"validation_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "foods_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "herbs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_sanskrit" text,
	"name_chinese" text,
	"category" text NOT NULL,
	"subcategory" text,
	"description" text,
	"rasa" text[] NOT NULL,
	"virya" text NOT NULL,
	"vipaka" text NOT NULL,
	"guna" text[] NOT NULL,
	"vata_effect" smallint NOT NULL,
	"pitta_effect" smallint NOT NULL,
	"kapha_effect" smallint NOT NULL,
	"ritu_fit" jsonb NOT NULL,
	"thermal_nature" text NOT NULL,
	"flavor" text[] NOT NULL,
	"organ_affinity" text[] NOT NULL,
	"actions" text[] NOT NULL,
	"element_fit" jsonb NOT NULL,
	"herb_actions" text[] NOT NULL,
	"contraindications" text[],
	"dosage_forms" text[],
	"pregnancy_safety" text,
	"prabhava" text,
	"is_culinary" boolean DEFAULT false NOT NULL,
	"bioactive_compounds" jsonb,
	"seed_source" text NOT NULL,
	"validation_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "herbs_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"dietary_restrictions" text[] DEFAULT '{}',
	"tradition_visibility" jsonb DEFAULT '{"ayurveda":true,"tcm":true,"naturopathy":true}'::jsonb,
	"cultural_cuisine_preferences" text[] DEFAULT '{}',
	"lat" numeric(9, 6),
	"lon" numeric(9, 6),
	"city" text,
	"weekly_herb_day" smallint DEFAULT 0,
	"timezone" text DEFAULT 'UTC',
	"profile_completeness" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "biomarker_food_mappings" ADD CONSTRAINT "biomarker_food_mappings_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_claims" ADD CONSTRAINT "evidence_claims_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "biomarker_mappings_key_idx" ON "biomarker_food_mappings" USING btree ("canonical_biomarker_key");--> statement-breakpoint
CREATE INDEX "cultural_cuisines_cuisine_idx" ON "cultural_cuisines" USING btree ("cuisine");--> statement-breakpoint
CREATE INDEX "data_sources_entity_idx" ON "data_sources" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "evidence_claims_food_id_idx" ON "evidence_claims" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "foods_category_subcategory_idx" ON "foods" USING btree ("category","subcategory");--> statement-breakpoint
CREATE INDEX "foods_rasa_gin_idx" ON "foods" USING gin ("rasa");--> statement-breakpoint
CREATE INDEX "foods_flavor_gin_idx" ON "foods" USING gin ("flavor");--> statement-breakpoint
CREATE INDEX "foods_organ_affinity_gin_idx" ON "foods" USING gin ("organ_affinity");--> statement-breakpoint
CREATE INDEX "foods_ritu_fit_gin_idx" ON "foods" USING gin ("ritu_fit");--> statement-breakpoint
CREATE INDEX "foods_element_fit_gin_idx" ON "foods" USING gin ("element_fit");--> statement-breakpoint
CREATE INDEX "herbs_category_subcategory_idx" ON "herbs" USING btree ("category","subcategory");--> statement-breakpoint
CREATE INDEX "herbs_rasa_gin_idx" ON "herbs" USING gin ("rasa");--> statement-breakpoint
CREATE INDEX "herbs_flavor_gin_idx" ON "herbs" USING gin ("flavor");--> statement-breakpoint
CREATE INDEX "herbs_organ_affinity_gin_idx" ON "herbs" USING gin ("organ_affinity");--> statement-breakpoint
CREATE INDEX "herbs_ritu_fit_gin_idx" ON "herbs" USING gin ("ritu_fit");--> statement-breakpoint
CREATE INDEX "herbs_element_fit_gin_idx" ON "herbs" USING gin ("element_fit");