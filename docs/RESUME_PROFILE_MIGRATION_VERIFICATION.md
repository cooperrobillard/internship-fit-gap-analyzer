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

- Add typed **Supabase helper functions** for structured resume profiles (list, create, update, delete, export).
- Add **tests** for helper behavior.
- Add **profile-management UI** later (after helpers and privacy copy are ready).
- Update privacy / data-control copy before user-facing profile save.

This verification does **not** claim full production readiness or a completed security audit.

---

## Document maintenance

Update when helpers or UI land, or if hosted schema/RLS changes. Cross-link [`PUBLIC_PRODUCT_ROADMAP.md`](PUBLIC_PRODUCT_ROADMAP.md).
