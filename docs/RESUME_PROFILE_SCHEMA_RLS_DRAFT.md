# Resume Profile Schema/RLS Draft

**Status:** Draft only · **Not applied to Supabase** · **Not a production migration** · Needs review before implementation

**Product:** Job Fit & Skill-Gap Analyzer (hosted prototype)  
**Repository:** internship-fit-gap-analyzer

Related: [`RESUME_PROFILE_SCHEMA_RLS_PLAN.md`](RESUME_PROFILE_SCHEMA_RLS_PLAN.md), [`PERSISTENT_RESUME_PROFILE_DESIGN.md`](PERSISTENT_RESUME_PROFILE_DESIGN.md), [`VERSION_17_INPUT_WORKFLOW_GUARDRAIL.md`](VERSION_17_INPUT_WORKFLOW_GUARDRAIL.md), [`PUBLIC_PRODUCT_ROADMAP.md`](PUBLIC_PRODUCT_ROADMAP.md).

---

## Summary

This draft packages reviewable SQL for a future **`public.resume_profiles`** table and **row-level security (RLS)** policies. It implements the **structured-skills-first** model from Version 17 planning: users can save named profiles made of skill lists and metadata, without storing raw resume text in v1.

The SQL is for **documentation and review only**. Do not run it on production Supabase until the manual checklist below is complete. Resume profiles are **not implemented** in the hosted app yet.

---

## Design choice

| Choice | Rationale |
|--------|-----------|
| **Structured skills + metadata** | Aligns with saved-analysis model; minimizes sensitive data custody |
| **No `raw_resume_text` column in v1** | Reduces privacy risk and scope creep; see [Raw resume text decision](#raw-resume-text-decision) |
| **One-time paste/upload unchanged** | Analysis can still use transient resume/job text without creating a profile |
| **`clerk_user_id` ownership** | Matches `job_analyses` and existing RLS in `web/database/schema.sql` (not a generic `user_id` alias) |

Each skill entry is a JSON object: `{ "skill": "Python", "category": "programming" }` in `extracted_skills` and `user_added_skills` arrays.

---

## Files in this draft

| File | Purpose |
|------|---------|
| [`sql/resume_profiles_schema_rls_draft.sql`](sql/resume_profiles_schema_rls_draft.sql) | Reviewable SQL (table, indexes, trigger, RLS) |
| This document | Context, review checklist, implementation sequence |

---

## Proposed table: `public.resume_profiles`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK, `default gen_random_uuid()` | Profile id |
| `clerk_user_id` | `text` NOT NULL | Clerk JWT `sub`; same pattern as saved analyses |
| `profile_name` | `text` NOT NULL | User-visible name; `CHECK (length(trim(profile_name)) > 0)` |
| `profile_description` | `text` NULL | Optional short description |
| `extracted_skills` | `jsonb` NOT NULL, default `'[]'` | Skills from analyzer at profile save; must be JSON array |
| `user_added_skills` | `jsonb` NOT NULL, default `'[]'` | User supplements; must be JSON array |
| `source_type` | `text` NOT NULL, default `'manual'` | One of: `manual`, `pasted`, `txt_upload`, `demo`, `imported` |
| `created_at` | `timestamptz` NOT NULL, default `now()` | |
| `updated_at` | `timestamptz` NOT NULL, default `now()` | Updated via `set_updated_at()` trigger |

**Indexes (draft):**

- `idx_resume_profiles_clerk_user_id` on `(clerk_user_id)`
- `idx_resume_profiles_clerk_user_id_created_at` on `(clerk_user_id, created_at DESC)`

**Optional (commented in SQL):** unique `(clerk_user_id, lower(profile_name))`; GIN indexes on skill jsonb — defer until query patterns are known.

**Legacy reconciliation:** An older repository sketch (`label`, `resume_text`) differs from this v1 shape. Applying this draft where the legacy table exists requires a **separate migration plan** (not included here).

---

## Raw resume text decision

**`raw_resume_text` is omitted from this draft.**

| Reason | Detail |
|--------|--------|
| **Privacy** | Raw resumes often contain PII; storing them increases responsibility |
| **Product alignment** | Version 17 guardrail and design doc recommend structured-skills-first |
| **Implementation safety** | No column avoids accidental writes and simplifies exports/RLS review |

If raw text is ever added:

- Requires **explicit user opt-in** UX and updated `/privacy` copy
- Requires **new migration**, retention policy, and security review
- Should not ship in the same release as v1 structured profiles without separate approval

---

## RLS policy intent

RLS is **enabled** on `public.resume_profiles`.

All policies use the same ownership test as existing hosted tables in `web/database/schema.sql`:

```sql
clerk_user_id = (SELECT auth.jwt() ->> 'sub')
```

| Operation | Rule |
|-----------|------|
| **SELECT** | User sees only rows where `clerk_user_id` matches their JWT `sub` |
| **INSERT** | User may insert only rows with their own `clerk_user_id` |
| **UPDATE** | User may update only their own rows; `WITH CHECK` prevents reassigning ownership |
| **DELETE** | User may delete only their own rows |

**Client rules:** Clerk-authenticated Supabase client only; **no service-role key in browser code**.

**Verification:** Two test users — User B must not read/update/delete User A’s profiles.

---

## SQL draft notes

### Confirmed from repository (review still required on deploy)

- Ownership column: **`clerk_user_id`** (document briefs sometimes say `user_id`; hosted tables use `clerk_user_id`).
- JWT predicate: **`(SELECT auth.jwt() ->> 'sub')`** — matches `job_analyses` policies in `web/database/schema.sql` and `web/database/README.md`.

### TODOs before apply

| Item | Action |
|------|--------|
| **Clerk JWT on Supabase** | Confirm third-party auth / JWT template so `sub` is available to RLS |
| **`set_updated_at()`** | Reuse existing function if already deployed; uncomment create block in SQL if missing |
| **Legacy `resume_profiles`** | If old table exists, plan ALTER or replace — do not blindly `CREATE TABLE` |
| **Unique profile names** | Decide whether to enable commented unique index |
| **Skill JSON shape** | Optional future `CHECK` for object keys; v1 relies on app validation |
| **`job_analyses` FK** | Commented future columns in SQL; separate migration when linking analyses to profiles |

### Header in SQL file

The `.sql` file is labeled **DRAFT ONLY — NOT APPLIED — NOT A PRODUCTION MIGRATION** at the top.

---

## Manual review checklist before applying

- [ ] Confirm Clerk user-id claim expression matches production (`auth.jwt() ->> 'sub'`)
- [ ] Confirm current saved-analysis RLS pattern and test with real Clerk tokens
- [ ] Run **two-user** RLS isolation test (create/list/update/delete)
- [ ] Confirm **no service-role key** in browser client code
- [ ] Confirm v1 writes store **skills + metadata only** — no raw resume text column
- [ ] Confirm **delete profile** does not delete past `job_analyses` (unless separately designed)
- [ ] Confirm **export** design excludes raw text in v1
- [ ] Update **privacy/data-control** copy before enabling profile save in UI
- [ ] Run **`pytest api/tests`**, **`python3 run_tests.py`**, **`cd web && npm run lint && npm run build`**
- [ ] Apply to **staging** Supabase first if available
- [ ] Run hosted smoke test after helpers/UI ship

---

## Future implementation sequence

| Step | Work |
|------|------|
| **Step 8** | Review this SQL draft against live Supabase / `web/database/schema.sql` deltas |
| **Step 9** | Create **actual migration** only after checklist sign-off (staging → production) |
| **Step 10** | Add typed Supabase helpers (`list/create/update/delete/export`) |
| **Step 11** | Add profile management UI (create, edit, delete, export) |
| **Step 12** | Add profile selector to analysis form (one-time vs profile) |
| **Step 13** | Export/delete/profile smoke tests + Version 17 profile checkpoint |

**Do not** skip Step 8–9 and jump to UI. **Do not** claim production readiness or a completed security audit when applying this draft.

---

## Open questions

| Question | Notes |
|----------|--------|
| **Unique profile names per user?** | Optional unique index on `(clerk_user_id, lower(profile_name))` — commented in SQL |
| **GIN indexes now or later?** | Defer until search/filter requirements exist |
| **Skill extraction for profiles** | Paste resume → `/api/analyze` or taxonomy pass → user reviews → save skills only; paste text not persisted |
| **extracted vs user_added skills** | Keep separate columns; merge for display/analysis in app layer |
| **Export format** | Markdown/CSV/JSON of structured fields only in v1 |
| **Default profile** | Future `is_default` column — out of v1 draft |
| **Raw text later** | Only after explicit opt-in design; new migration + policy review |

---

## Document maintenance

Update when the SQL draft is revised, applied as a migration, or superseded. Cross-link [`RESUME_PROFILE_SCHEMA_RLS_PLAN.md`](RESUME_PROFILE_SCHEMA_RLS_PLAN.md) for product/sequence context.
