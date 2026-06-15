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
--
-- Purpose:
--   Future `public.resume_profiles` table storing structured skills + metadata.
--   Omits raw resume text (structured-skills-first model).
--
-- Related docs:
--   - docs/RESUME_PROFILE_SCHEMA_RLS_DRAFT.md
--   - docs/RESUME_PROFILE_SCHEMA_RLS_PLAN.md
--   - docs/PERSISTENT_RESUME_PROFILE_DESIGN.md
--
-- Ownership column:
--   Uses `clerk_user_id` (text) to match `job_analyses` and other hosted tables.
--   Clerk subject = JWT claim `sub` via auth.jwt()->>'sub'.
--
-- Legacy note:
--   An older first-pass sketch in web/database/schema.sql used `label` + `resume_text`.
--   This draft replaces that shape for v1 implementation. Applying this draft to a
--   database that already has the legacy table requires a separate migration plan
--   (ALTER / new table + cutover) — not included here.
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

  -- Clerk user id (JWT sub). Named clerk_user_id to match job_analyses RLS pattern.
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
  'Clerk subject (JWT sub claim); must match auth.jwt()->>''sub'' for RLS.';

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
-- Expression unique indexes may need verification in target Postgres/Supabase version.
--
-- CREATE UNIQUE INDEX idx_resume_profiles_clerk_user_id_profile_name_lower
--   ON public.resume_profiles (clerk_user_id, lower(profile_name));

-- Future consideration only — GIN indexes for skill search inside jsonb:
-- CREATE INDEX idx_resume_profiles_extracted_skills_gin
--   ON public.resume_profiles USING gin (extracted_skills jsonb_path_ops);

-- -----------------------------------------------------------------------------
-- updated_at trigger (optional if function already exists project-wide)
-- -----------------------------------------------------------------------------

CREATE TRIGGER resume_profiles_set_updated_at
  BEFORE UPDATE ON public.resume_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
--
-- Matches web/database/schema.sql pattern for job_analyses / legacy resume_profiles:
--   clerk_user_id = (select auth.jwt()->>'sub')
--
-- TODO before apply: Confirm deployed Supabase project uses the same Clerk JWT
-- template and that auth.jwt()->>'sub' matches inserts from the Next.js client.
-- If your project uses a different claim path, replace the predicate consistently.

ALTER TABLE public.resume_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY resume_profiles_select_own
  ON public.resume_profiles
  FOR SELECT
  USING (clerk_user_id = (SELECT auth.jwt() ->> 'sub'));

CREATE POLICY resume_profiles_insert_own
  ON public.resume_profiles
  FOR INSERT
  WITH CHECK (clerk_user_id = (SELECT auth.jwt() ->> 'sub'));

CREATE POLICY resume_profiles_update_own
  ON public.resume_profiles
  FOR UPDATE
  USING (clerk_user_id = (SELECT auth.jwt() ->> 'sub'))
  WITH CHECK (clerk_user_id = (SELECT auth.jwt() ->> 'sub'));

CREATE POLICY resume_profiles_delete_own
  ON public.resume_profiles
  FOR DELETE
  USING (clerk_user_id = (SELECT auth.jwt() ->> 'sub'));

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
-- RLS on job_analyses inserts/updates would need WITH CHECK ensuring resume_profile_id,
-- when set, belongs to the same clerk_user_id. Review when implementing.

-- -----------------------------------------------------------------------------
-- END DRAFT
-- =============================================================================
