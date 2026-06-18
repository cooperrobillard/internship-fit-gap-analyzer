# Resume Profile Migration Verification

**Dev 18** · **Hosted Supabase** · **Documentation only** · **No app code changes**

Related: [`web/database/migrations/20260617_structured_resume_profiles.sql`](../web/database/migrations/20260617_structured_resume_profiles.sql), [`RESUME_PROFILE_PRE_MIGRATION_REVIEW.md`](RESUME_PROFILE_PRE_MIGRATION_REVIEW.md), [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md).

---

## Summary

Dev 18 verified the hosted Supabase structured resume-profile migration. `public.resume_profiles` is now **structured-skills-first** (skill lists and metadata, not raw resume text). This prepares the database for future persistent resume-profile helper code.

**Resume-profile UI and Supabase helper functions are not implemented yet.** This step verified schema, indexes, RLS, and that existing hosted flows were unaffected.

This document is not a full production-readiness or security audit.

---

## Migration file

**Reference:** [`web/database/migrations/20260617_structured_resume_profiles.sql`](../web/database/migrations/20260617_structured_resume_profiles.sql)

The hosted database was verified against this migration target: ALTER from legacy `label` / `resume_text` to `profile_name`, `profile_description`, `extracted_skills`, `user_added_skills`, and `source_type`, with Clerk ownership via `clerk_user_id` and matching RLS policies.

---

## Verification note

During Dev 18, the first pre-apply check attempted to count rows where a `resume_text` column existed:

```sql
-- Pre-apply style check (failed as expected on post-migration schema)
SELECT COUNT(*) FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'resume_profiles'
  AND column_name = 'resume_text';
```

That query **failed** because `resume_text` **no longer existed** on the hosted table. This indicated the hosted table was **already in the post-migration shape** by the time Dev 18 verification ran (the column had been removed in a prior apply or equivalent schema state).

Verification continued with **safe current-state checks** against the expected structured columns, indexes, RLS policies, and a rollback-only two-user isolation test.

---

## Schema findings

| Column | Present | Type / notes |
|--------|---------|--------------|
| `id` | Yes | `uuid` primary key |
| `clerk_user_id` | Yes | `text` — Clerk JWT `sub` |
| `profile_name` | Yes | `text` |
| `profile_description` | Yes | `text`, nullable |
| `extracted_skills` | Yes | `jsonb` |
| `user_added_skills` | Yes | `jsonb` |
| `source_type` | Yes | `text` |
| `created_at` | Yes | `timestamptz` |
| `updated_at` | Yes | `timestamptz` |

| Legacy / expected check | Result |
|-------------------------|--------|
| `resume_text` column exists | **false** |
| `label` column exists | **false** |
| `profile_name` column exists | **true** |
| Table row count after RLS test | **0** |

`extracted_skills` and `user_added_skills` are **jsonb** fields (JSON arrays of skill objects, not plain text arrays).

---

## Index findings

| Index | Purpose |
|-------|---------|
| `resume_profiles_pkey` | Primary key lookup on `id` |
| `idx_resume_profiles_clerk_user_id` | Filter profiles by owning Clerk user |
| `idx_resume_profiles_clerk_user_id_created_at` | List a user’s profiles ordered by `created_at` (newest first) |

These support primary key lookup and user-owned profile listing without scanning unrelated rows.

---

## RLS verification

| Check | Result |
|-------|--------|
| RLS enabled on `public.resume_profiles` | **Yes** |

**Policies present:**

- `resume_profiles_select_own`
- `resume_profiles_insert_own`
- `resume_profiles_update_own`
- `resume_profiles_delete_own`

**Ownership predicate (Clerk JWT `sub`):**

```sql
clerk_user_id = (select auth.jwt() ->> 'sub'::text)
```

| Operation | Policy behavior |
|-----------|-----------------|
| **SELECT** | `USING` — own-row filtering |
| **INSERT** | `WITH CHECK` — ownership on insert |
| **UPDATE** | `USING` and `WITH CHECK` — own-row read and write |
| **DELETE** | `USING` — own-row filtering |

Policies use `TO authenticated`, consistent with saved analyses on `job_analyses`.

---

## Simulated two-user RLS test

A **rollback-only** SQL test was run in the Supabase SQL editor using synthetic Clerk user ids:

- `dev18-test-user-a`
- `dev18-test-user-b`

The first attempted version used **text array** literals for skill columns. The schema expects **jsonb**, so the test was corrected to use jsonb values (e.g. `'[]'::jsonb` or jsonb array literals).

**Results:**

- User A could insert and read a row with `clerk_user_id = 'dev18-test-user-a'`.
- User B could insert a row with `clerk_user_id = 'dev18-test-user-b'`.
- User A **could not** see User B’s row under User A’s session context (and vice versa for cross-user access).
- The transaction was **rolled back** so no test data persisted.
- Final `public.resume_profiles` row count remained **0**.

---

## Hosted app smoke test

Ran after migration verification to confirm existing flows were unaffected. Use generic sample text only.

| Check | Result |
|-------|--------|
| Landing page loads | Pass |
| Sign-in (Clerk) | Pass |
| Dashboard loads while signed in | Pass |
| Existing saved analyses visible | Pass |
| Sample / demo analysis (Try sample inputs) | Pass |
| Save analysis | Pass |
| Saved analysis detail view | Pass |
| Search / filter saved analyses | Pass |
| Delete saved analysis | Pass |
| Recurring gap stats | Pass |
| Compare two saved analyses | Pass |
| Export / download | Pass |
| Privacy / data-control page or section (`/privacy`) | Pass |
| No secrets, tokens, stack traces, or private raw text visible in UI | Pass |

---

## Privacy notes

- Raw pasted **resume text** is **not** stored by default on the hosted write path.
- Raw pasted **job-description text** is **not** stored by default on the hosted write path.
- Structured resume profiles are **skills-first** (`extracted_skills`, `user_added_skills`); no `resume_text` column.
- Uploaded `.txt` files remain **transient / client-side only** (not persisted to Supabase).
- No PDF/DOCX parsing is introduced by this migration.
- No AI / semantic matching is introduced by this migration.
- No **service-role key** should be used in browser code (publishable key + Clerk session only).

---

## Remaining work

- ~~Add typed **Supabase helper functions** for structured resume profiles~~ — **Dev 18 Step 2:** [`web/src/lib/supabase/resume-profiles.ts`](../web/src/lib/supabase/resume-profiles.ts)
- ~~Add **tests** for helper behavior~~ — **Dev 18 Step 3:** manual coverage checklist below (no web test runner in `web/package.json`)
- Add **profile-management UI** later (after helpers and privacy copy are ready).

**Dev 18 Step 4:** Basic management UI added — [`resume-profiles-panel.tsx`](../web/src/app/dashboard/resume-profiles-panel.tsx). Profiles are **not** connected to analysis yet.

---

## Helper test coverage (Dev 18 Step 3)

The web app has **no Vitest/Jest test script** in `web/package.json`, so Step 3 adds **exported pure utilities** plus this manual checklist instead of automated tests. Verify with `cd web && npm run lint && npm run build` after helper changes.

**Module:** [`web/src/lib/supabase/resume-profiles.ts`](../web/src/lib/supabase/resume-profiles.ts)

**Exported pure utilities (test-ready):**

| Export | Purpose |
|--------|---------|
| `normalizeSkillStrings` / `normalizeSkillList` | Skill list normalization |
| `validateResumeProfileName` | Trim + reject empty names |
| `mapResumeProfileRow` | snake_case row → camelCase `ResumeProfile` |
| `parseResumeProfileSourceType` | Safe source_type parsing |
| `buildResumeProfileInsertRow` | Insert payload; `clerk_user_id` from param |
| `buildResumeProfileUpdatePatch` | Update patch builder |
| `RESUME_PROFILE_QUERY_FIELDS` | Select list — no `resume_text` |

### Manual checklist

**1. Skill normalization** (`normalizeSkillStrings`)

- [ ] `["  Python  ", "SQL"]` → `["Python", "SQL"]`
- [ ] `["", "   ", "Git"]` → `["Git"]`
- [ ] `["python", "Python", "PYTHON"]` → `["python"]` (first casing kept)
- [ ] `[{ skill: " React " }, "react"]` → `["React"]`
- [ ] `null`, non-array, or mixed invalid values → `[]`

**2. Row mapping** (`mapResumeProfileRow`)

- [ ] Maps `clerk_user_id` → `clerkUserId`, `profile_name` → `profileName`, etc.
- [ ] Invalid `extracted_skills` / `user_added_skills` jsonb → `[]`
- [ ] Returns `ResumeProfile` only — no snake_case row exposed to callers

**3. Input validation**

- [ ] `createResumeProfile` with empty `clerkUserId` → error (session message)
- [ ] `buildResumeProfileInsertRow` / create with `profileName: "   "` → `"Profile name cannot be empty."`
- [ ] `updateResumeProfile` with empty `profileId` → error
- [ ] `buildResumeProfileUpdatePatch({ profileName: "" })` → empty-name error
- [ ] `updateResumeProfile` / `deleteResumeProfile` with empty `clerkUserId` → error

**4. Query scoping** (inspect helper source or use a local mock)

- [ ] `listResumeProfiles` → `.from("resume_profiles").eq("clerk_user_id", userId).order("created_at", { ascending: false })`
- [ ] `createResumeProfile` → insert row `clerk_user_id` equals passed Clerk user id (not from input)
- [ ] `updateResumeProfile` → `.eq("id", profileId).eq("clerk_user_id", userId)`
- [ ] `deleteResumeProfile` → lookup and delete both filter `id` + `clerk_user_id`

**5. Privacy regression**

- [ ] `RESUME_PROFILE_QUERY_FIELDS` does not include `resume_text`
- [ ] `CreateResumeProfileInput` / `UpdateResumeProfileInput` / `ResumeProfile` have no raw resume text fields
- [ ] Helpers accept browser `SupabaseClient` only — no service-role key usage in module

### Left for future automated / integration tests

- Real Supabase RLS two-user isolation via helpers (after web test runner added)
- End-to-end create/list/update/delete against staging with Clerk session
- UI flows and dashboard wiring
- Update privacy / data-control copy before user-facing profile save.

This verification does **not** claim full production readiness or a completed security audit.

---

## Document maintenance

Update when helpers or UI land, or if hosted schema/RLS changes. Cross-link [`PUBLIC_PRODUCT_ROADMAP.md`](PUBLIC_PRODUCT_ROADMAP.md).
