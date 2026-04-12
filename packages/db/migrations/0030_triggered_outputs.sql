-- Migration: Triggered Outputs (Split 12)
-- Creates tables for weekly herb recommendations, trigger state, and food biases.

BEGIN;

-- Weekly herb recommendations (one per user per ISO week)
CREATE TABLE IF NOT EXISTS weekly_herbs (
  user_id UUID NOT NULL,
  iso_year INTEGER NOT NULL,
  iso_week INTEGER NOT NULL CHECK (iso_week >= 1 AND iso_week <= 53),
  herb_id TEXT NOT NULL,
  tradition_notes JSONB,
  credits JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, iso_year, iso_week)
);

CREATE INDEX IF NOT EXISTS idx_weekly_herbs_user_week
  ON weekly_herbs (user_id, iso_year DESC, iso_week DESC);

-- Weekly herb feedback
CREATE TABLE IF NOT EXISTS weekly_herb_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  herb_id TEXT NOT NULL,
  iso_year INTEGER NOT NULL,
  iso_week INTEGER NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('tried', 'helpful', 'not_for_me', 'remind_next_week')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, iso_year, iso_week, feedback_type)
);

CREATE INDEX IF NOT EXISTS idx_weekly_herb_feedback_user_recent
  ON weekly_herb_feedback (user_id, iso_year DESC, iso_week DESC);

-- Trigger suppression state (upsert semantics)
CREATE TABLE IF NOT EXISTS trigger_state (
  user_id UUID NOT NULL,
  trigger_type TEXT NOT NULL,
  dismissal_type TEXT NOT NULL CHECK (dismissal_type IN ('got_it', 'remind_me', 'not_interested')),
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  suppressed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, trigger_type)
);

CREATE INDEX IF NOT EXISTS idx_trigger_state_user
  ON trigger_state (user_id);

-- Lifestyle trigger feedback
CREATE TABLE IF NOT EXISTS lifestyle_trigger_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_instance_id TEXT NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('helped', 'tried', 'dismissed')),
  feedback_detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trigger_feedback_user_type
  ON lifestyle_trigger_feedback (user_id, trigger_type);

-- Food biases (temporary scoring biases from trigger rules)
CREATE TABLE IF NOT EXISTS food_biases (
  user_id UUID NOT NULL,
  bias_type TEXT NOT NULL,
  bias_config JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  source_trigger TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, bias_type)
);

CREATE INDEX IF NOT EXISTS idx_food_biases_user
  ON food_biases (user_id);

-- RLS policies
ALTER TABLE weekly_herbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_herb_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE trigger_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifestyle_trigger_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_biases ENABLE ROW LEVEL SECURITY;

-- Users can read their own rows
CREATE POLICY weekly_herbs_select ON weekly_herbs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY weekly_herb_feedback_select ON weekly_herb_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY weekly_herb_feedback_insert ON weekly_herb_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY trigger_state_select ON trigger_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY lifestyle_trigger_feedback_select ON lifestyle_trigger_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY lifestyle_trigger_feedback_insert ON lifestyle_trigger_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY food_biases_select ON food_biases FOR SELECT USING (auth.uid() = user_id);

COMMIT;
