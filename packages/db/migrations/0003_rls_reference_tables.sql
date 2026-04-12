-- 0003: Row-Level Security for reference tables.
-- All 7 reference tables get public SELECT access for anon and authenticated roles.
-- No INSERT/UPDATE/DELETE policies -- denied by default when RLS is enabled.
-- service_role bypasses RLS (Supabase built-in behavior) for seeds and admin ops.
-- Idempotent: DROP IF EXISTS before each CREATE POLICY.

-- foods
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_foods" ON foods;
CREATE POLICY "public_read_foods"
  ON foods
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- herbs
ALTER TABLE herbs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_herbs" ON herbs;
CREATE POLICY "public_read_herbs"
  ON herbs
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- food_categories
ALTER TABLE food_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_food_categories" ON food_categories;
CREATE POLICY "public_read_food_categories"
  ON food_categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- data_sources
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_data_sources" ON data_sources;
CREATE POLICY "public_read_data_sources"
  ON data_sources
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- evidence_claims
ALTER TABLE evidence_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_evidence_claims" ON evidence_claims;
CREATE POLICY "public_read_evidence_claims"
  ON evidence_claims
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- biomarker_food_mappings
ALTER TABLE biomarker_food_mappings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_biomarker_food_mappings" ON biomarker_food_mappings;
CREATE POLICY "public_read_biomarker_food_mappings"
  ON biomarker_food_mappings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- cultural_cuisines
ALTER TABLE cultural_cuisines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_cultural_cuisines" ON cultural_cuisines;
CREATE POLICY "public_read_cultural_cuisines"
  ON cultural_cuisines
  FOR SELECT
  TO anon, authenticated
  USING (true);
