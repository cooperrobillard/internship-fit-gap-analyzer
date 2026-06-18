-- =============================================================================
-- Migration: structured resume_profiles (Version 17 Step 11)
-- =============================================================================
--
-- What this does:
--   Converts the existing legacy public.resume_profiles table from
--   label + resume_text to the structured-skills-first shape:
--   profile_name, profile_description, extracted_skills, user_added_skills,
--   source_type.
--
-- Context:
--   - Target: hosted Supabase where resume_profiles already exists and is empty.
--   - This is an ALTER migration, not CREATE TABLE.
--   - Intentionally removes raw resume text storage (resume_text column dropped).
--   - Preserves Clerk user ownership through clerk_user_id (unchanged).
--   - Does not modify job_analyses, analysis_runs, or other tables.
--
-- Apply manually:
--   1. Review this file in full.
--   2. Run on staging Supabase SQL editor first (not production).
--   3. After apply, run two-user RLS verification (see
--      docs/RESUME_PROFILE_PRE_MIGRATION_REVIEW.md).
--   4. Do not use the service-role key from browser code.
--
-- Related:
--   - docs/RESUME_PROFILE_PRE_MIGRATION_REVIEW.md
--   - docs/sql/resume_profiles_schema_rls_draft.sql (docs-only draft; superseded
--     for apply by this migration file)
--
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Rename legacy label → profile_name
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'resume_profiles'
      AND column_name = 'label'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'resume_profiles'
      AND column_name = 'profile_name'
  ) THEN
    ALTER TABLE public.resume_profiles
      RENAME COLUMN label TO profile_name;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Drop legacy resume_text (structured-skills-first; table is empty)
-- -----------------------------------------------------------------------------

ALTER TABLE public.resume_profiles
  DROP COLUMN IF EXISTS resume_text;

-- -----------------------------------------------------------------------------
-- 3. Add structured columns (idempotent)
-- -----------------------------------------------------------------------------

ALTER TABLE public.resume_profiles
  ADD COLUMN IF NOT EXISTS profile_description text;

ALTER TABLE public.resume_profiles
  ADD COLUMN IF NOT EXISTS extracted_skills jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.resume_profiles
  ADD COLUMN IF NOT EXISTS user_added_skills jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.resume_profiles
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'manual';

-- -----------------------------------------------------------------------------
-- 4. Constraints (idempotent)
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'resume_profiles_profile_name_not_blank'
      AND conrelid = 'public.resume_profiles'::regclass
  ) THEN
    ALTER TABLE public.resume_profiles
      ADD CONSTRAINT resume_profiles_profile_name_not_blank
      CHECK (length(trim(profile_name)) > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'resume_profiles_extracted_skills_is_array'
      AND conrelid = 'public.resume_profiles'::regclass
  ) THEN
    ALTER TABLE public.resume_profiles
      ADD CONSTRAINT resume_profiles_extracted_skills_is_array
      CHECK (jsonb_typeof(extracted_skills) = 'array');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'resume_profiles_user_added_skills_is_array'
      AND conrelid = 'public.resume_profiles'::regclass
  ) THEN
    ALTER TABLE public.resume_profiles
      ADD CONSTRAINT resume_profiles_user_added_skills_is_array
      CHECK (jsonb_typeof(user_added_skills) = 'array');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'resume_profiles_source_type_allowed'
      AND conrelid = 'public.resume_profiles'::regclass
  ) THEN
    ALTER TABLE public.resume_profiles
      ADD CONSTRAINT resume_profiles_source_type_allowed
      CHECK (source_type IN ('manual', 'pasted', 'txt_upload', 'demo', 'imported'));
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 5. Indexes (idempotent)
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_resume_profiles_clerk_user_id
  ON public.resume_profiles (clerk_user_id);

CREATE INDEX IF NOT EXISTS idx_resume_profiles_clerk_user_id_created_at
  ON public.resume_profiles (clerk_user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 6. Table/column comments (structured skills; no raw resume text)
-- -----------------------------------------------------------------------------

COMMENT ON TABLE public.resume_profiles IS
  'User-owned structured resume profiles: skill lists and metadata only. '
  'Does not store raw resume text. Ownership via clerk_user_id (Clerk JWT sub).';

COMMENT ON COLUMN public.resume_profiles.clerk_user_id IS
  'Clerk subject (JWT sub); must match auth.jwt()->>''sub'' for RLS (see job_analyses).';

COMMENT ON COLUMN public.resume_profiles.profile_name IS
  'User-visible profile name; non-blank after trim.';

COMMENT ON COLUMN public.resume_profiles.profile_description IS
  'Optional user description or notes about the profile.';

COMMENT ON COLUMN public.resume_profiles.extracted_skills IS
  'JSON array of objects: [{ "skill": "...", "category": "..." }, ...].';

COMMENT ON COLUMN public.resume_profiles.user_added_skills IS
  'JSON array of user-edited or supplemental skills; same shape as extracted_skills.';

COMMENT ON COLUMN public.resume_profiles.source_type IS
  'How the profile was created: manual | pasted | txt_upload | demo | imported.';

-- -----------------------------------------------------------------------------
-- 7. Row Level Security — preserve ownership model; recreate policies to match
--    saved analyses (confirmed predicate on hosted Supabase)
-- -----------------------------------------------------------------------------

ALTER TABLE public.resume_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS resume_profiles_select_own ON public.resume_profiles;
DROP POLICY IF EXISTS resume_profiles_insert_own ON public.resume_profiles;
DROP POLICY IF EXISTS resume_profiles_update_own ON public.resume_profiles;
DROP POLICY IF EXISTS resume_profiles_delete_own ON public.resume_profiles;

CREATE POLICY resume_profiles_select_own
  ON public.resume_profiles FOR SELECT
  TO authenticated
  USING (clerk_user_id = (select auth.jwt() ->> 'sub'::text));

CREATE POLICY resume_profiles_insert_own
  ON public.resume_profiles FOR INSERT
  TO authenticated
  WITH CHECK (clerk_user_id = (select auth.jwt() ->> 'sub'::text));

CREATE POLICY resume_profiles_update_own
  ON public.resume_profiles FOR UPDATE
  TO authenticated
  USING (clerk_user_id = (select auth.jwt() ->> 'sub'::text))
  WITH CHECK (clerk_user_id = (select auth.jwt() ->> 'sub'::text));

CREATE POLICY resume_profiles_delete_own
  ON public.resume_profiles FOR DELETE
  TO authenticated
  USING (clerk_user_id = (select auth.jwt() ->> 'sub'::text));

COMMIT;

-- -----------------------------------------------------------------------------
-- Post-apply verification (run separately after COMMIT):
--
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'resume_profiles'
--   ORDER BY ordinal_position;
--
--   SELECT policyname, cmd, qual, with_check
--   FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'resume_profiles';
--
--   -- Confirm resume_text is absent:
--   SELECT COUNT(*) FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name = 'resume_profiles'
--     AND column_name = 'resume_text';
--
-- Then run two-user RLS isolation test before app helpers or UI.
-- =============================================================================
