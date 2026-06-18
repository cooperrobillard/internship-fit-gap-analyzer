# Resume Profile Schema/RLS Draft

**Status:** Draft only · **Migration file authored (not applied)** · Needs staging apply + RLS verification before implementation

**Apply migration (when ready):** [`web/database/migrations/20260617_structured_resume_profiles.sql`](../web/database/migrations/20260617_structured_resume_profiles.sql) — ALTER path for existing legacy `resume_profiles`; supersedes this draft for manual apply.

**Product:** Job Fit & Skill-Gap Analyzer (hosted prototype)  
**Repository:** internship-fit-gap-analyzer

Related: [`SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md`](SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md), [`RESUME_PROFILE_SCHEMA_RLS_PLAN.md`](RESUME_PROFILE_SCHEMA_RLS_PLAN.md), [`PERSISTENT_RESUME_PROFILE_DESIGN.md`](PERSISTENT_RESUME_PROFILE_DESIGN.md), [`VERSION_17_INPUT_WORKFLOW_GUARDRAIL.md`](VERSION_17_INPUT_WORKFLOW_GUARDRAIL.md), [`PUBLIC_PRODUCT_ROADMAP.md`](PUBLIC_PRODUCT_ROADMAP.md).

**Aligned with:** [`SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md`](SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md) (Version 17 Step 8) — updated in Version 17 Step 9.

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

## Updates from saved-analysis RLS review (Step 8 → Step 9)

This draft was updated after [`SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md`](SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md) to mirror hosted **saved analyses** as closely as possible.

### Confirmed in repository (applied to this draft)

| Finding | Applied change |
|---------|----------------|
| **Ownership column** | **`clerk_user_id` text NOT NULL** — not generic `user_id` |
| **Value on insert** | Same as `saveCloudAnalysis`: Clerk `userId` from `useAuth()` / JWT **`sub`** |
| **RLS predicate** | **`clerk_user_id = (select auth.jwt()->>'sub')`** — matches `job_analyses` in `web/database/schema.sql` |
| **Policy role** | **`TO authenticated`** on all four policies (was missing in Step 7 SQL) |
| **Policy names** | `resume_profiles_select_own`, `_insert_own`, `_update_own`, `_delete_own` — same style as `job_analyses_*_own` |
| **Client access** | `createClerkSupabaseClient(() => session.getToken())`; publishable key only |
| **Read isolation** | App may rely on RLS without `.eq("clerk_user_id", …)` on SELECT (current saved-analysis pattern) |
| **Future helpers** | Should accept `(supabase, clerkUserId, …)` like `saveCloudAnalysis` / `saved-analyses.ts` |

### Not confirmed from repository alone (still TODO before migration)

| Item | Why it remains open |
|------|---------------------|
| **Production Supabase policies** | Deployed project may differ from `web/database/schema.sql` |
| **Clerk JWT → `authenticated` role** | Must verify with a real signed-in token on target project |
| **`sub` claim = `useAuth().userId`** | Confirm Clerk third-party auth template in Supabase dashboard |
| **Two-user isolation on production** | Manual smoke test only — no automated RLS test in repo |
| **Legacy `resume_profiles` table** | If old `label` + `resume_text` shape exists, needs migration plan before `CREATE TABLE` |

### How the SQL draft mirrors saved analyses

- Same ownership column and JWT predicate as `job_analyses_select_own` / `resume_profiles_*_own` in `web/database/schema.sql`.
- Resume profiles are a **top-level owned table** (like `job_analyses` at the row level) — no parent FK on INSERT policies for v1.
- **`raw_resume_text` remains omitted** — structured skills only.

---

## Files in this draft

| File | Purpose |
|------|---------|
| [`sql/resume_profiles_schema_rls_draft.sql`](sql/resume_profiles_schema_rls_draft.sql) | Reviewable SQL draft (CREATE TABLE shape; reference only) |
| [`../web/database/migrations/20260617_structured_resume_profiles.sql`](../web/database/migrations/20260617_structured_resume_profiles.sql) | **Actual migration** (ALTER; not applied) |
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

All policies mirror **`job_analyses`** and legacy **`resume_profiles`** policies in `web/database/schema.sql` (see [`SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md`](SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md)):

```sql
-- Ownership expression (repo-confirmed; verify on deployed Supabase before apply):
clerk_user_id = (select auth.jwt()->>'sub')
```

Each policy is **`TO authenticated`**.

| Operation | Policy name | Rule |
|-----------|-------------|------|
| **SELECT** | `resume_profiles_select_own` | Own rows only |
| **INSERT** | `resume_profiles_insert_own` | `WITH CHECK` own `clerk_user_id` |
| **UPDATE** | `resume_profiles_update_own` | `USING` + `WITH CHECK` own rows |
| **DELETE** | `resume_profiles_delete_own` | Own rows only |

**Client rules:** `createClerkSupabaseClient(() => session.getToken())` only; **no service-role key in browser code**.

**Verification:** Repeat [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md) §8 pattern with profile CRUD — User B must not read/update/delete User A’s profiles.

---

## SQL draft notes

### Repo-confirmed (Step 8)

- Ownership: **`clerk_user_id`** — hosted tables do not use generic `user_id`.
- Predicate: **`clerk_user_id = (select auth.jwt()->>'sub')`** — same spelling as `web/database/schema.sql`.
- Policies: **`TO authenticated`** on SELECT, INSERT, UPDATE, DELETE.

### TODOs before apply (specific)

| # | Action |
|---|--------|
| 1 | **Confirm exact predicate on deployed Supabase** — open SQL editor / policies for `job_analyses`; if production differs from repo, use **that** expression for `resume_profiles` instead of assuming this draft |
| 2 | **Verify Clerk JWT** — `sub` available to RLS; matches `useAuth().userId` on insert |
| 3 | **Two-user manual test** — User A creates profile; User B cannot SELECT/UPDATE/DELETE it ([`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md) §8 pattern) |
| 4 | **No service-role key in browser** — only `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in client |
| 5 | **Profile helpers** — when implemented, mirror `saveCloudAnalysis(supabase, clerkUserId, …)` and `fetchRecentSavedAnalyses(getAccessToken)` patterns |
| 6 | **Cross-user isolation** — confirm profile rows cannot be read/updated/deleted across users |
| 7 | **`set_updated_at()`** — reuse if deployed; uncomment create block in SQL if missing |
| 8 | **Legacy `resume_profiles`** — if old table exists (`label`, `resume_text`), plan ALTER/replace — do not blind `CREATE TABLE` |
| 9 | **Privacy copy** — update `/privacy` before profile save UI |
| 10 | **Staging first** — apply migration on dev/staging Supabase before production |

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
| **Step 8** | Saved-analysis RLS pattern review — **complete** ([`SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md`](SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md)) |
| **Step 9** | Align resume-profile SQL draft with saved-analysis pattern — **complete** (this document) |
| **Step 10** | **Final pre-migration review** — confirm production Supabase `job_analyses` policies match repo; sign off checklist |
| **Step 11** | Create **actual migration** (staging → production) only after Step 10 |
| **Step 12** | Typed Supabase helpers (`list/create/update/delete/export`) |
| **Step 13** | Profile management UI |
| **Step 14** | Profile selector in analysis form |
| **Step 15** | Export/delete/profile smoke tests + checkpoint |

**Recommended next:** **Step 10 — final pre-migration review** (conservative). Do not apply SQL until production predicate is confirmed. **Do not** jump to UI before helpers (Step 12+).

---

## Recommended next step

**Version 17 Step 10 — final pre-migration review for resume-profile schema/RLS**

- Compare this draft to **live** Supabase policies for `job_analyses` (not only `web/database/schema.sql`).
- Complete the manual checklist above, including two-user isolation.
- Only then author a real migration file (Step 11).

Resume profiles remain **not implemented** in app code.

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

Update when the SQL draft is revised, applied as a migration, or superseded. Cross-link [`RESUME_PROFILE_SCHEMA_RLS_PLAN.md`](RESUME_PROFILE_SCHEMA_RLS_PLAN.md) and [`SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md`](SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md).
