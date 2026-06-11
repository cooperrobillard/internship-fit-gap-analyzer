-- =============================================================================
-- Internship Fit & Skill-Gap Analyzer — Supabase/Postgres schema (first pass)
-- =============================================================================
--
-- Clerk user IDs are stored as TEXT because Clerk subject IDs are strings (e.g.
-- user_2abc...), not UUIDs.
--
-- Row Level Security (RLS) policies assume the Supabase request carries a Clerk
-- session JWT and that auth.jwt()->>'sub' matches the row's clerk_user_id.
-- Configure Clerk as a third-party auth provider in Supabase before relying on
-- these policies.
--
-- This schema is a first-pass draft. Run it in a development Supabase project,
-- verify RLS with real Clerk tokens, and revise before any production launch.
--
-- resume_text and job_text are included intentionally as a design question: they
-- enable re-display and re-analysis in the hosted UI, but they may need
-- encryption, minimization, hashing-only storage, or removal before public
-- multi-user launch. Treat them as sensitive PII.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A. profiles — one row per Clerk user (app identity)
-- -----------------------------------------------------------------------------

CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL UNIQUE,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'App profile keyed by Clerk user ID.';
COMMENT ON COLUMN profiles.clerk_user_id IS 'Clerk subject (JWT sub claim); string, not UUID.';

-- -----------------------------------------------------------------------------
-- B. resume_profiles — saved resume versions per user
-- -----------------------------------------------------------------------------

CREATE TABLE resume_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL,
  label text NOT NULL,
  resume_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE resume_profiles IS 'User-owned resume snapshots; resume_text is sensitive PII.';
COMMENT ON COLUMN resume_profiles.resume_text IS 'May require encryption or removal before public launch.';

-- -----------------------------------------------------------------------------
-- C. analysis_runs — groups one or more job analyses from a single session
-- -----------------------------------------------------------------------------

CREATE TABLE analysis_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL,
  resume_profile_id uuid REFERENCES resume_profiles (id) ON DELETE SET NULL,
  run_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE analysis_runs IS 'A single analysis session; may include multiple job_analyses rows.';

-- -----------------------------------------------------------------------------
-- D. job_analyses — one job posting compared against a resume for a run
-- -----------------------------------------------------------------------------

CREATE TABLE job_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_run_id uuid NOT NULL REFERENCES analysis_runs (id) ON DELETE CASCADE,
  clerk_user_id text NOT NULL,
  job_title text,
  company text,
  source_url text,
  notes text,
  job_text text,
  matched_skills_count integer NOT NULL DEFAULT 0,
  missing_skills_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE job_analyses IS 'Per-job analysis result; mirrors local SQLite job_results concept.';
COMMENT ON COLUMN job_analyses.job_text IS 'Sensitive posting text; privacy review required before launch.';

-- -----------------------------------------------------------------------------
-- E. skill_gaps — individual missing skills for a job analysis
-- -----------------------------------------------------------------------------

CREATE TABLE skill_gaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_analysis_id uuid NOT NULL REFERENCES job_analyses (id) ON DELETE CASCADE,
  clerk_user_id text NOT NULL,
  skill text NOT NULL,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE skill_gaps IS 'Normalized missing skills for comparison and recurring-gap queries.';

-- -----------------------------------------------------------------------------
-- F. matched_skills — individual matched skills for a job analysis
-- -----------------------------------------------------------------------------

CREATE TABLE matched_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_analysis_id uuid NOT NULL REFERENCES job_analyses (id) ON DELETE CASCADE,
  clerk_user_id text NOT NULL,
  skill text NOT NULL,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE matched_skills IS 'Normalized matched skills (local SQLite stores counts only today).';

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------

CREATE INDEX idx_profiles_clerk_user_id ON profiles (clerk_user_id);

CREATE INDEX idx_resume_profiles_clerk_user_id ON resume_profiles (clerk_user_id);

CREATE INDEX idx_analysis_runs_clerk_user_id ON analysis_runs (clerk_user_id);
CREATE INDEX idx_analysis_runs_resume_profile_id ON analysis_runs (resume_profile_id);

CREATE INDEX idx_job_analyses_clerk_user_id ON job_analyses (clerk_user_id);
CREATE INDEX idx_job_analyses_analysis_run_id ON job_analyses (analysis_run_id);
-- Supports dashboard search/filter by posting metadata (per-user scans use clerk_user_id index first).
CREATE INDEX idx_job_analyses_clerk_user_id_job_title ON job_analyses (clerk_user_id, job_title);
CREATE INDEX idx_job_analyses_clerk_user_id_company ON job_analyses (clerk_user_id, company);

CREATE INDEX idx_skill_gaps_clerk_user_id ON skill_gaps (clerk_user_id);
CREATE INDEX idx_skill_gaps_job_analysis_id ON skill_gaps (job_analysis_id);

CREATE INDEX idx_matched_skills_clerk_user_id ON matched_skills (clerk_user_id);
CREATE INDEX idx_matched_skills_job_analysis_id ON matched_skills (job_analysis_id);

-- -----------------------------------------------------------------------------
-- updated_at triggers
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER resume_profiles_set_updated_at
  BEFORE UPDATE ON resume_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER job_analyses_set_updated_at
  BEFORE UPDATE ON job_analyses
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE matched_skills ENABLE ROW LEVEL SECURITY;

-- Ownership expression reused in policies:
--   clerk_user_id = (select auth.jwt()->>'sub')

-- profiles --------------------------------------------------------------------

CREATE POLICY profiles_select_own
  ON profiles FOR SELECT
  TO authenticated
  USING (clerk_user_id = (select auth.jwt()->>'sub'));

CREATE POLICY profiles_insert_own
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (clerk_user_id = (select auth.jwt()->>'sub'));

CREATE POLICY profiles_update_own
  ON profiles FOR UPDATE
  TO authenticated
  USING (clerk_user_id = (select auth.jwt()->>'sub'))
  WITH CHECK (clerk_user_id = (select auth.jwt()->>'sub'));

CREATE POLICY profiles_delete_own
  ON profiles FOR DELETE
  TO authenticated
  USING (clerk_user_id = (select auth.jwt()->>'sub'));

-- resume_profiles -------------------------------------------------------------

CREATE POLICY resume_profiles_select_own
  ON resume_profiles FOR SELECT
  TO authenticated
  USING (clerk_user_id = (select auth.jwt()->>'sub'));

CREATE POLICY resume_profiles_insert_own
  ON resume_profiles FOR INSERT
  TO authenticated
  WITH CHECK (clerk_user_id = (select auth.jwt()->>'sub'));

CREATE POLICY resume_profiles_update_own
  ON resume_profiles FOR UPDATE
  TO authenticated
  USING (clerk_user_id = (select auth.jwt()->>'sub'))
  WITH CHECK (clerk_user_id = (select auth.jwt()->>'sub'));

CREATE POLICY resume_profiles_delete_own
  ON resume_profiles FOR DELETE
  TO authenticated
  USING (clerk_user_id = (select auth.jwt()->>'sub'));

-- analysis_runs ---------------------------------------------------------------

CREATE POLICY analysis_runs_select_own
  ON analysis_runs FOR SELECT
  TO authenticated
  USING (clerk_user_id = (select auth.jwt()->>'sub'));

CREATE POLICY analysis_runs_insert_own
  ON analysis_runs FOR INSERT
  TO authenticated
  WITH CHECK (
    clerk_user_id = (select auth.jwt()->>'sub')
    AND (
      resume_profile_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM resume_profiles rp
        WHERE rp.id = resume_profile_id
          AND rp.clerk_user_id = (select auth.jwt()->>'sub')
      )
    )
  );

CREATE POLICY analysis_runs_update_own
  ON analysis_runs FOR UPDATE
  TO authenticated
  USING (clerk_user_id = (select auth.jwt()->>'sub'))
  WITH CHECK (
    clerk_user_id = (select auth.jwt()->>'sub')
    AND (
      resume_profile_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM resume_profiles rp
        WHERE rp.id = resume_profile_id
          AND rp.clerk_user_id = (select auth.jwt()->>'sub')
      )
    )
  );

CREATE POLICY analysis_runs_delete_own
  ON analysis_runs FOR DELETE
  TO authenticated
  USING (clerk_user_id = (select auth.jwt()->>'sub'));

-- job_analyses ----------------------------------------------------------------

CREATE POLICY job_analyses_select_own
  ON job_analyses FOR SELECT
  TO authenticated
  USING (clerk_user_id = (select auth.jwt()->>'sub'));

CREATE POLICY job_analyses_insert_own
  ON job_analyses FOR INSERT
  TO authenticated
  WITH CHECK (
    clerk_user_id = (select auth.jwt()->>'sub')
    AND EXISTS (
      SELECT 1
      FROM analysis_runs ar
      WHERE ar.id = analysis_run_id
        AND ar.clerk_user_id = (select auth.jwt()->>'sub')
    )
  );

CREATE POLICY job_analyses_update_own
  ON job_analyses FOR UPDATE
  TO authenticated
  USING (clerk_user_id = (select auth.jwt()->>'sub'))
  WITH CHECK (
    clerk_user_id = (select auth.jwt()->>'sub')
    AND EXISTS (
      SELECT 1
      FROM analysis_runs ar
      WHERE ar.id = analysis_run_id
        AND ar.clerk_user_id = (select auth.jwt()->>'sub')
    )
  );

CREATE POLICY job_analyses_delete_own
  ON job_analyses FOR DELETE
  TO authenticated
  USING (clerk_user_id = (select auth.jwt()->>'sub'));

-- skill_gaps ------------------------------------------------------------------

CREATE POLICY skill_gaps_select_own
  ON skill_gaps FOR SELECT
  TO authenticated
  USING (clerk_user_id = (select auth.jwt()->>'sub'));

CREATE POLICY skill_gaps_insert_own
  ON skill_gaps FOR INSERT
  TO authenticated
  WITH CHECK (
    clerk_user_id = (select auth.jwt()->>'sub')
    AND EXISTS (
      SELECT 1
      FROM job_analyses ja
      WHERE ja.id = job_analysis_id
        AND ja.clerk_user_id = (select auth.jwt()->>'sub')
    )
  );

CREATE POLICY skill_gaps_delete_own
  ON skill_gaps FOR DELETE
  TO authenticated
  USING (clerk_user_id = (select auth.jwt()->>'sub'));

-- matched_skills --------------------------------------------------------------

CREATE POLICY matched_skills_select_own
  ON matched_skills FOR SELECT
  TO authenticated
  USING (clerk_user_id = (select auth.jwt()->>'sub'));

CREATE POLICY matched_skills_insert_own
  ON matched_skills FOR INSERT
  TO authenticated
  WITH CHECK (
    clerk_user_id = (select auth.jwt()->>'sub')
    AND EXISTS (
      SELECT 1
      FROM job_analyses ja
      WHERE ja.id = job_analysis_id
        AND ja.clerk_user_id = (select auth.jwt()->>'sub')
    )
  );

CREATE POLICY matched_skills_delete_own
  ON matched_skills FOR DELETE
  TO authenticated
  USING (clerk_user_id = (select auth.jwt()->>'sub'));
