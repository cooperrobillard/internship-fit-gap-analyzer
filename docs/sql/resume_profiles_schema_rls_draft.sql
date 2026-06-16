-- =============================================================================
-- DRAFT ONLY — NOT APPLIED — NOT A PRODUCTION MIGRATION
-- =============================================================================
--
-- Job Fit & Skill-Gap Analyzer — structured resume_profiles (Version 17 draft)
--
-- Status:
--   - Documentation / review draft only
--   - Do NOT run against production Supabase without review
--   - Do NOT treat this file as an applied migration
--   - Aligned with docs/SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md (Version 17 Step 9)
--
-- Purpose:
--   Future `public.resume_profiles` table storing structured skills + metadata.
--   Omits raw resume text (structured-skills-first model).
--
-- Related docs:
--   - docs/RESUME_PROFILE_SCHEMA_RLS_DRAFT.md
--   - docs/SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md
--   - docs/RESUME_PROFILE_SCHEMA_RLS_PLAN.md
--   - docs/PERSISTENT_RESUME_PROFILE_DESIGN.md
--
-- Ownership column (mirrors job_analyses / saved analyses):
--   clerk_user_id text NOT NULL — Clerk user id from useAuth().userId / JWT sub
--   (NOT a generic user_id column)
--
-- RLS predicate (repo-confirmed in web/database/schema.sql — verify on production):
--   clerk_user_id = (select auth.jwt()->>'sub')
--   Policies: TO authenticated (same as job_analyses_*_own)
--
-- TODO before apply:
--   1. Open deployed Supabase → confirm job_analyses policies use this exact predicate.
--      If production differs, replace the expression below with the saved-analysis
--      predicate from the live project — do not assume repo file matches production.
--   2. Verify Clerk JWT sub matches clerk_user_id on insert from Next.js client.
--   3. Run two-user RLS test (HOSTED_PROTOTYPE_SMOKE_TEST.md §8 pattern for profiles).
--   4. Confirm browser uses publishable key only — no service-role key in client code.
--
-- Legacy note:
--   An older first-pass sketch in web/database/schema.sql used label + resume_text.
--   This draft replaces that shape for v1. If that table already exists, plan a
--   separate migration (ALTER / replace) — do not blindly CREATE TABLE.
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Optional: shared updated_at helper (skip if set_updated_at() already exists)
-- -----------------------------------------------------------------------------

-- CREATE OR REPLACE FUNCTION set_updated_at()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   NEW.updated_at = now();
--   RETURN NEW;
-- END;
-- $$;

-- -----------------------------------------------------------------------------
-- Table: public.resume_profiles (structured skills v1)
-- -----------------------------------------------------------------------------

CREATE TABLE public.resume_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Mirrors saveCloudAnalysis / job_analyses: clerk_user_id from Clerk JWT sub.
  clerk_user_id text NOT NULL,

  profile_name text NOT NULL,
  profile_description text,

  extracted_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  user_added_skills jsonb NOT NULL DEFAULT '[]'::jsonb,

  source_type text NOT NULL DEFAULT 'manual',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT resume_profiles_profile_name_not_blank
    CHECK (length(trim(profile_name)) > 0),

  CONSTRAINT resume_profiles_extracted_skills_is_array
    CHECK (jsonb_typeof(extracted_skills) = 'array'),

  CONSTRAINT resume_profiles_user_added_skills_is_array
    CHECK (jsonb_typeof(user_added_skills) = 'array'),

  CONSTRAINT resume_profiles_source_type_allowed
    CHECK (source_type IN ('manual', 'pasted', 'txt_upload', 'demo', 'imported'))
);

COMMENT ON TABLE public.resume_profiles IS
  'User-owned structured resume profiles (skills + metadata). Draft v1 — no raw resume text.';

COMMENT ON COLUMN public.resume_profiles.clerk_user_id IS
  'Clerk subject (JWT sub); must match auth.jwt()->>''sub'' for RLS (see job_analyses).';

COMMENT ON COLUMN public.resume_profiles.extracted_skills IS
  'JSON array of objects: [{ "skill": "...", "category": "..." }, ...]';

COMMENT ON COLUMN public.resume_profiles.user_added_skills IS
  'JSON array of user-edited/supplemental skills; same shape as extracted_skills.';

COMMENT ON COLUMN public.resume_profiles.source_type IS
  'How the profile was created: manual | pasted | txt_upload | demo | imported.';

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------

CREATE INDEX idx_resume_profiles_clerk_user_id
  ON public.resume_profiles (clerk_user_id);

CREATE INDEX idx_resume_profiles_clerk_user_id_created_at
  ON public.resume_profiles (clerk_user_id, created_at DESC);

-- Optional: enforce unique profile names per user (review before enabling).
--
-- CREATE UNIQUE INDEX idx_resume_profiles_clerk_user_id_profile_name_lower
--   ON public.resume_profiles (clerk_user_id, lower(profile_name));

-- Future consideration — GIN indexes for skill search inside jsonb:
-- CREATE INDEX idx_resume_profiles_extracted_skills_gin
--   ON public.resume_profiles USING gin (extracted_skills jsonb_path_ops);

-- -----------------------------------------------------------------------------
-- updated_at trigger (requires set_updated_at() — see optional block above)
-- -----------------------------------------------------------------------------

CREATE TRIGGER resume_profiles_set_updated_at
  BEFORE UPDATE ON public.resume_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security — mirrors job_analyses / resume_profiles in schema.sql
-- -----------------------------------------------------------------------------
--
-- Repo reference: web/database/schema.sql
--   job_analyses_select_own, resume_profiles_select_own, etc.
--
-- Expression (repo-confirmed):
--   clerk_user_id = (select auth.jwt()->>'sub')
--
-- TODO: If deployed Supabase uses a different saved-analysis predicate, copy that
-- expression here instead — must match job_analyses policies on the target project.

ALTER TABLE public.resume_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY resume_profiles_select_own
  ON public.resume_profiles FOR SELECT
  TO authenticated
  USING (clerk_user_id = (select auth.jwt()->>'sub'));

CREATE POLICY resume_profiles_insert_own
  ON public.resume_profiles FOR INSERT
  TO authenticated
  WITH CHECK (clerk_user_id = (select auth.jwt()->>'sub'));

CREATE POLICY resume_profiles_update_own
  ON public.resume_profiles FOR UPDATE
  TO authenticated
  USING (clerk_user_id = (select auth.jwt()->>'sub'))
  WITH CHECK (clerk_user_id = (select auth.jwt()->>'sub'));

CREATE POLICY resume_profiles_delete_own
  ON public.resume_profiles FOR DELETE
  TO authenticated
  USING (clerk_user_id = (select auth.jwt()->>'sub'));

-- -----------------------------------------------------------------------------
-- Future (NOT in v1 draft): link job_analyses to resume_profiles
-- -----------------------------------------------------------------------------
--
-- ALTER TABLE public.job_analyses
--   ADD COLUMN resume_profile_id uuid REFERENCES public.resume_profiles (id) ON DELETE SET NULL;
--
-- ALTER TABLE public.job_analyses
--   ADD COLUMN resume_profile_name_snapshot text;
--
-- analysis_runs INSERT policy in schema.sql already validates resume_profile_id
-- ownership when non-null — reuse that pattern when linking.

-- -----------------------------------------------------------------------------
-- END DRAFT
-- =============================================================================
