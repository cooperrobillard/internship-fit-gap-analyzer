# Structured Resume Profile Schema and RLS Plan

**Status:** Planning document only — June 2026  
**Product:** Job Fit & Skill-Gap Analyzer (hosted prototype)  
**Repository:** internship-fit-gap-analyzer

Related: [`PERSISTENT_RESUME_PROFILE_DESIGN.md`](PERSISTENT_RESUME_PROFILE_DESIGN.md), [`VERSION_17_INPUT_WORKFLOW_GUARDRAIL.md`](VERSION_17_INPUT_WORKFLOW_GUARDRAIL.md), [`VERSION_16_PRODUCTION_READINESS_REVIEW.md`](VERSION_16_PRODUCTION_READINESS_REVIEW.md), [`PUBLIC_PRODUCT_ROADMAP.md`](PUBLIC_PRODUCT_ROADMAP.md), [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md).

**This document does not create migrations, edit schema files, or implement resume profiles.** It is a concrete plan for a future implementation step.

---

## Summary

This plan prepares for **persistent resume profiles** on Supabase/Postgres using a **structured-skills-first** approach aligned with [`PERSISTENT_RESUME_PROFILE_DESIGN.md`](PERSISTENT_RESUME_PROFILE_DESIGN.md).

The first database version should store **profile metadata and skill arrays** only. **Raw resume text is not stored by default** and should be **omitted from the first migration** unless a later product decision explicitly approves hybrid opt-in storage.

One-time paste, transient `.txt` upload, and fictional demo inputs remain available without creating a profile. Saved job analyses continue to store structured comparison results and job metadata—not raw resume or job body text.

---

## Design principles

| Principle | Intent |
|-----------|--------|
| **User-owned data only** | Every profile row belongs to one signed-in Clerk user. |
| **No raw resume text by default** | First implementation writes skills + metadata only. |
| **Structured skills first** | Profiles are reusable skill representations, not document storage. |
| **Explicit consent before raw text** | Any future raw-text column requires separate UX, copy, and migration review. |
| **One-time analysis remains** | Paste/upload/demo paths work without a saved profile. |
| **Different resume per analysis** | User selects a profile or one-off input per comparison. |
| **Delete/export controls** | Users can remove and export profile data they own. |
| **RLS verified with multiple users** | Cross-user isolation tested before calling the feature done. |
| **Match existing hosted patterns** | Ownership column, RLS style, and Supabase client helpers mirror saved analyses. |
| **No service-role key in browser** | Clerk session + RLS-scoped client only on the dashboard. |

---

## Proposed first table

### Table: `resume_profiles`

Conceptual Supabase/Postgres table for **Version 17 structured profile v1**.

| Column | Type | Constraints / default | v1 usage |
|--------|------|------------------------|----------|
| `id` | `uuid` | PK, `default gen_random_uuid()` | Stable profile id |
| `clerk_user_id` | `text` | `not null` | Clerk user id (same ownership pattern as `job_analyses`) |
| `profile_name` | `text` | `not null` | User-visible name |
| `profile_description` | `text` | `null` | Optional short label/notes |
| `extracted_skills` | `jsonb` | `not null`, `default '[]'::jsonb` | Skills from analyzer at profile save |
| `user_added_skills` | `jsonb` | `not null`, `default '[]'::jsonb` | User edits/supplements |
| `source_type` | `text` | `not null`, `default 'manual'` | e.g. `manual`, `pasted`, `txt_upload`, `demo` |
| `created_at` | `timestamptz` | `not null`, `default now()` | |
| `updated_at` | `timestamptz` | `not null`, `default now()` | Bump on update (trigger) |

**JSON shape (each skill entry):**

```json
{ "skill": "Python", "category": "programming" }
```

Arrays are stored as JSON arrays of objects. Category strings should align with the hosted analyzer taxonomy where possible.

### Columns intentionally deferred from v1

The design brief listed optional sensitive/future columns. **Do not add these in the first migration:**

| Column | Reason to defer |
|--------|-----------------|
| `raw_resume_text` | Sensitive; not needed for structured-skills v1 |
| `raw_text_saved` | Only meaningful if raw text exists; defer with raw text |

If an unwired repository sketch already defines `resume_text` or similar, **revise or replace** it with this v1 shape during implementation—do not wire legacy columns by inertia.

### Indexes (planned)

- `idx_resume_profiles_clerk_user_id` on `(clerk_user_id)`
- Optional: unique partial index on `(clerk_user_id, lower(profile_name))` if product requires unique names per user (see open questions)

### Optional future link on `job_analyses` (separate migration, Phase 2+)

Not required for profile CRUD v1. When linking analyses to profiles:

| Column | Type | Notes |
|--------|------|--------|
| `resume_profile_id` | `uuid`, nullable, FK → `resume_profiles(id)` | `ON DELETE SET NULL` recommended |
| `resume_profile_name_snapshot` | `text`, nullable | Preserve label in history if profile deleted |

---

## Optional future table or fields

Keep **out of first implementation**; document for later review only:

| Addition | Purpose |
|----------|---------|
| `profile_version` | Version history / audit |
| `last_used_at` | Sort “recently used” in selector |
| `is_default` | Default profile per user |
| `resume_file_name` | Display only; not file storage |
| `parsed_sections` | jsonb sections if parser added |
| `skill_confidence` | jsonb metadata per skill |
| `raw_resume_text` + encryption | Hybrid opt-in only |
| `raw_text_saved` | Boolean guard for opt-in path |
| `created_by`, `updated_by` | Audit fields |

---

## Data model recommendation

### First implementation (recommended)

1. **Store profile metadata and structured skills only** (`extracted_skills`, `user_added_skills`).
2. **Do not store raw resume text** in v1 writes or exports by default.
3. **Keep one-time pasted/uploaded resume analysis separate** — analysis input is transient unless user explicitly saves a profile.
4. **Merge rule for analysis input from profile** — when a profile is selected, derive analyzer input from skill lists (see open questions); do not persist paste buffer to cloud.

### Decision: `raw_resume_text` in first migration?

| Option | Assessment |
|--------|------------|
| **A) Omit `raw_resume_text` entirely from first table** | **Recommended (safer).** No column = no accidental writes, simpler RLS review, clearer privacy copy. |
| **B) Include nullable `raw_resume_text`, never write in v1** | Weaker: column existence invites future scope creep and audit questions. |

**Final recommendation:** **Omit `raw_resume_text` and `raw_text_saved` from the first migration.** Add them only in a **later migration** if hybrid opt-in is approved with updated privacy copy and production gates.

---

## Clerk/Supabase user ownership model

### Ownership column

Use **`clerk_user_id`** (not a generic `user_id` alias) to match hosted saved analyses:

- Value = Clerk authenticated user id (`sub` from session JWT).
- Inserts must set `clerk_user_id` from the signed-in session, never from client-supplied arbitrary strings without verification.

### Client access pattern

Follow existing saved-analysis helpers:

1. User signs in with Clerk.
2. Dashboard creates Supabase client with Clerk JWT (`createClerkSupabaseClient` pattern).
3. Queries insert/select/update/delete with RLS enforcing `clerk_user_id = auth.jwt() ->> 'sub'` (or equivalent Clerk JWT claim used today on `job_analyses`).

### Rules

| Rule | Requirement |
|------|-------------|
| Browser | **No** Supabase service-role key |
| Server routes (if added later) | Must not bypass RLS without strong justification |
| Cross-user access | Impossible via normal client paths when RLS is correct |
| Anonymous users | No profile CRUD; profiles require sign-in |

Re-verify JWT claim mapping against current `job_analyses` policies before applying new policies.

---

## RLS policy plan

### Baseline

```sql
ALTER TABLE resume_profiles ENABLE ROW LEVEL SECURITY;
```

### Policy intent (pseudocode)

All policies use the same Clerk subject as existing hosted tables.

| Operation | Policy intent |
|-----------|----------------|
| **SELECT** | Allow when `clerk_user_id = <authenticated Clerk user id>` |
| **INSERT** | Allow when new row’s `clerk_user_id = <authenticated Clerk user id>` |
| **UPDATE** | Allow when existing row’s `clerk_user_id = <authenticated Clerk user id>` |
| **DELETE** | Allow when existing row’s `clerk_user_id = <authenticated Clerk user id>` |

### Illustrative policy names (draft — not applied)

```sql
-- SELECT own profiles
CREATE POLICY resume_profiles_select_own
  ON resume_profiles FOR SELECT
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));

-- INSERT own profiles
CREATE POLICY resume_profiles_insert_own
  ON resume_profiles FOR INSERT
  WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

-- UPDATE own profiles
CREATE POLICY resume_profiles_update_own
  ON resume_profiles FOR UPDATE
  USING (clerk_user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (clerk_user_id = (auth.jwt() ->> 'sub'));

-- DELETE own profiles
CREATE POLICY resume_profiles_delete_own
  ON resume_profiles FOR DELETE
  USING (clerk_user_id = (auth.jwt() ->> 'sub'));
```

**Note:** Exact JWT expression must match working `job_analyses` policies in the deployed project. Adjust claim path if Clerk template differs.

### `job_analyses` FK policies (future)

If `resume_profile_id` is added:

- User may only set FK to a profile they own.
- `ON DELETE SET NULL` on `job_analyses.resume_profile_id` so deleting a profile does not delete analyses.

---

## Expected helper/API shape

Future TypeScript helpers under `web/src/lib/supabase/` (names illustrative — **not implemented in this step**).

### Types (conceptual)

```typescript
type ResumeProfileSkill = { skill: string; category: string };

type ResumeProfileRow = {
  id: string;
  clerk_user_id: string;
  profile_name: string;
  profile_description: string | null;
  extracted_skills: ResumeProfileSkill[];
  user_added_skills: ResumeProfileSkill[];
  source_type: "manual" | "pasted" | "txt_upload" | "demo";
  created_at: string;
  updated_at: string;
};

type CreateResumeProfileInput = {
  profile_name: string;
  profile_description?: string;
  extracted_skills: ResumeProfileSkill[];
  user_added_skills?: ResumeProfileSkill[];
  source_type: ResumeProfileRow["source_type"];
};

type UpdateResumeProfileInput = Partial<
  Pick<
    CreateResumeProfileInput,
    "profile_name" | "profile_description" | "extracted_skills" | "user_added_skills"
  >
>;
```

### Functions (conceptual)

| Function | Responsibility |
|----------|----------------|
| `listResumeProfiles(supabase, clerkUserId)` | Select own profiles, ordered by `updated_at desc` |
| `getResumeProfile(supabase, clerkUserId, profileId)` | Single profile; error if not found or not owned |
| `createResumeProfile(supabase, clerkUserId, input)` | Insert with `clerk_user_id`; validate non-empty name and skills array |
| `updateResumeProfile(supabase, clerkUserId, profileId, updates)` | Patch allowed fields; touch `updated_at` |
| `deleteResumeProfile(supabase, clerkUserId, profileId)` | Delete own row; return success/error message safe for UI |
| `exportResumeProfile(profile)` | Build Markdown/CSV/JSON export (structured fields only in v1) |
| `skillsToResumeTextForAnalysis(skills)` | Local helper: serialize skills to text for `/api/analyze` (v1 bridge) |
| `selectResumeProfileForAnalysis(profile)` | Load skills into analysis form state (no cloud raw text) |

### Analysis paths (unchanged vs new)

| Path | Behavior |
|------|----------|
| `analyzeWithOneTimeResume(resumeText, jobText)` | Existing flow — paste/upload text → `/api/analyze` |
| Profile-selected analysis | Skills → serialized text (or future API) → `/api/analyze` with one-time job text |

Save-analysis helpers (`saveCloudAnalysis`, etc.) remain separate; saving a profile does not save a job analysis.

---

## Expected UI behavior

Future hosted dashboard (phased; not built in Step 6):

| Area | Behavior |
|------|----------|
| **Profile management** | Section or page listing user’s profiles (name, skill count, updated date) |
| **Create profile** | From pasted resume → run extraction → user reviews skills → explicit **Save resume profile** |
| **Manual create** | User types name and skills without paste (source `manual`) |
| **Analysis form selector** | “One-time paste/upload” **or** choose saved profile |
| **Edit** | Name, description, extracted + user-added skills |
| **Delete** | Confirmation modal; explain saved analyses are not deleted |
| **Export** | Download structured profile export |
| **Copy** | Clear: “This profile stores skill lists only—not your full resume text.” |

Preserve Version 17 input UX: transient `.txt`, **Try sample inputs**, **Clear inputs**, analyze vs save distinction.

---

## Delete/export behavior

### Delete profile

- Removes the `resume_profiles` row for that user.
- **Does not** automatically delete `job_analyses` or skill child rows.
- If `resume_profile_id` exists on analyses: set `NULL` on delete (recommended) and keep `resume_profile_name_snapshot` if populated.

### Export profile

**v1 export includes:**

- `profile_name`, `profile_description`
- `extracted_skills`, `user_added_skills`
- `source_type`, `created_at`, `updated_at`

**v1 export excludes:**

- Raw resume text (column absent in v1)
- Other users’ data

Export UI must state what is included. If raw text is ever added later, full-text export requires a **separate explicit user action**.

---

## Testing plan

Run when migration and helpers are implemented (not required for this docs-only step):

| Category | Check |
|----------|--------|
| **Schema smoke** | Table exists; columns match plan; RLS enabled; indexes present |
| **RLS two-user** | User A creates profile; User B cannot SELECT/UPDATE/DELETE it |
| **CRUD** | Create, list, get, update name/skills, delete own profile |
| **Negative** | Wrong `profileId`, missing auth, empty name rejected |
| **One-time analysis** | Paste/upload analysis without any profile |
| **Saved analyses** | Save/read/delete job analysis unchanged; no raw resume/job on save path |
| **Exports** | Profile export has skills only; no raw text fields |
| **Python** | `pytest api/tests`, `python3 run_tests.py`, `python3 -m py_compile api/main.py` |
| **Web** | `cd web && npm run lint && npm run build` |
| **Privacy/repo** | No `.env` commits; no private resume files in repo |
| **Hosted smoke** | [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md) + profile scenarios |

Document manual RLS steps in the hosted smoke test addendum when implementation starts.

---

## Implementation sequence recommendation

Conservative order for **future** steps (after this plan):

| Step | Work | Notes |
|------|------|--------|
| **Step 7** | **SQL draft review → applied migration** | Review draft SQL against this doc; apply to Supabase only when ready; re-run RLS checks |
| **Step 8** | **Typed Supabase helpers** | `list/create/update/delete/export` for structured profiles only |
| **Step 9** | **Profile management UI** | List, create, edit, delete with confirmations |
| **Step 10** | **Analysis form profile selector** | One-time vs profile; skills → analyze bridge |
| **Step 11** | **Export/delete verification + checkpoint** | Two-user RLS sign-off; privacy copy update; Version 17 profile checkpoint doc |

**Before Step 7 on production:** Prefer applying migration to a **staging** Supabase project first if available.

**Parallel track:** Version 18 production hardening (rate limits, abuse review) remains advisable before broad public profile use.

**Do not** start with UI (Step 9–10) before schema/RLS and helpers (Steps 7–8).

---

## Risks and open questions

| Topic | Question / risk |
|-------|------------------|
| **`raw_resume_text` column** | Omit in v1 (recommended). Revisit only with hybrid opt-in design. |
| **Skill normalization** | Taxonomy canonical names vs free-form user strings? Recommend canonical on extract; allow user_added with dedupe on save. |
| **Extraction source** | Reuse `/api/analyze` resume parsing path or client-side taxonomy pass? Must not persist paste text when saving profile. |
| **extracted vs user_added** | Keep separate arrays so UI can show “from resume” vs “you added”; merge for analysis display. |
| **Duplicate skills** | Dedupe by normalized `(skill, category)` on save; last-write or prefer user_added wins—pick one rule in implementation. |
| **Unique profile names** | Per-user unique names vs duplicates allowed? Recommend soft uniqueness (warn on duplicate name). |
| **Privacy copy** | `/privacy` and dashboard must state skills-only storage before launch. |
| **Rate limiting** | Profile CRUD + analysis volume before public launch ([`VERSION_16_PRODUCTION_READINESS_REVIEW.md`](VERSION_16_PRODUCTION_READINESS_REVIEW.md)). |
| **Legacy schema sketch** | Existing unwired `resume_profiles` definition may conflict—reconcile before migration. |
| **Analyzer bridge** | `/api/analyze` expects resume text today; skill-only profiles need `skillsToResumeTextForAnalysis` or API extension—document limitations in UI. |

---

## Final recommendation

The next safest step after this plan is **Step 7: reviewed SQL draft → controlled migration** on Supabase (staging first), **not** dashboard UI first.

Persistent resume profiles should begin with **structured skills and metadata only**, with **raw resume text omitted from the first schema version** and **one-time paste/upload analysis unchanged**.

Do not claim production readiness or a completed security audit when shipping profile v1. Complete two-user RLS verification and privacy copy updates as part of Step 11.

---

## Document maintenance

Update when:

- migration SQL is drafted or applied,
- `job_analyses` profile linkage is approved,
- raw-text opt-in is approved or rejected.

Cross-links: [`PERSISTENT_RESUME_PROFILE_DESIGN.md`](PERSISTENT_RESUME_PROFILE_DESIGN.md) (product/design), this doc (schema/RLS).
