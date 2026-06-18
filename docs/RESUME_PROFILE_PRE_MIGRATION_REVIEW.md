# Resume Profile Pre-Migration Review

**Status:** Pre-migration review complete · **Migration file authored (Step 11)** · **Not applied to Supabase** · **No resume-profile app code implemented**

**Migration file (not applied):** [`web/database/migrations/20260617_structured_resume_profiles.sql`](../web/database/migrations/20260617_structured_resume_profiles.sql)

**Product:** Job Fit & Skill-Gap Analyzer (hosted prototype)  
**Repository:** internship-fit-gap-analyzer  
**Review date:** June 2026 (Version 17 Step 10)

Related: [`PERSISTENT_RESUME_PROFILE_DESIGN.md`](PERSISTENT_RESUME_PROFILE_DESIGN.md), [`RESUME_PROFILE_SCHEMA_RLS_PLAN.md`](RESUME_PROFILE_SCHEMA_RLS_PLAN.md), [`RESUME_PROFILE_SCHEMA_RLS_DRAFT.md`](RESUME_PROFILE_SCHEMA_RLS_DRAFT.md), [`sql/resume_profiles_schema_rls_draft.sql`](sql/resume_profiles_schema_rls_draft.sql), [`SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md`](SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md), [`VERSION_16_PRODUCTION_READINESS_REVIEW.md`](VERSION_16_PRODUCTION_READINESS_REVIEW.md), [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md).

---

## Summary judgment

**Documentation and schema design:** Ready to **author** a structured `resume_profiles` migration from the aligned SQL draft.

**Applying a migration to a live Supabase project:** **Ready for staging apply** after reviewing the migration file. **Production apply** only after staging two-user RLS verification passes.

| Area | Verdict |
|------|---------|
| Product/design guardrails | Ready |
| Structured-skills-first data model | Ready |
| SQL draft aligned with saved analyses (repo) | Ready |
| Production Supabase policy match | **Confirmed** (June 2026 live inspection) |
| Two-user RLS on new table | Required immediately after migration |
| Profile UI / helpers | Out of scope until post-migration verification |
| Privacy copy for profiles | Not ready — must update before user-facing profile save |

**Bottom line:** Live Supabase inspection (June 2026) confirmed `resume_profiles` exists empty with legacy `label`/`resume_text`, RLS enabled, and the ownership predicate `clerk_user_id = (select auth.jwt() ->> 'sub'::text)` on existing policies. The **ALTER migration file** is ready for manual staging apply; do not apply to production until staging two-user RLS verification passes.

This review is not a formal security audit and does not claim production readiness.

---

## Reviewed artifacts

| Document | Role |
|----------|------|
| [`PERSISTENT_RESUME_PROFILE_DESIGN.md`](PERSISTENT_RESUME_PROFILE_DESIGN.md) | Product intent, consent, structured-skills-first, no raw text by default |
| [`RESUME_PROFILE_SCHEMA_RLS_PLAN.md`](RESUME_PROFILE_SCHEMA_RLS_PLAN.md) | Table shape, RLS intent, implementation phases |
| [`RESUME_PROFILE_SCHEMA_RLS_DRAFT.md`](RESUME_PROFILE_SCHEMA_RLS_DRAFT.md) | Draft overview, Step 8/9 alignment, checklists |
| [`sql/resume_profiles_schema_rls_draft.sql`](sql/resume_profiles_schema_rls_draft.sql) | Reviewable SQL (not applied) |
| [`SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md`](SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md) | Confirmed saved-analysis ownership + RLS pattern in repo |
| [`PUBLIC_PRODUCT_ROADMAP.md`](PUBLIC_PRODUCT_ROADMAP.md) | Version 17 progress and gates |

---

## Proposed first migration scope

The first **actual** migration (when approved) should include **only**:

| Item | Detail |
|------|--------|
| **Table** | `public.resume_profiles` |
| **Columns** | `id`, `clerk_user_id`, `profile_name`, `profile_description`, `extracted_skills`, `user_added_skills`, `source_type`, `created_at`, `updated_at` |
| **Constraints** | Non-blank `profile_name`; `extracted_skills` / `user_added_skills` are JSON arrays; `source_type` enum check |
| **Indexes** | `idx_resume_profiles_clerk_user_id`; `idx_resume_profiles_clerk_user_id_created_at` |
| **RLS** | `ENABLE ROW LEVEL SECURITY` |
| **Policies** | `resume_profiles_select_own`, `_insert_own`, `_update_own`, `_delete_own` — `TO authenticated`, ownership predicate matching saved analyses |
| **Trigger** | `resume_profiles_set_updated_at` **only if** `set_updated_at()` already exists on target DB (do not duplicate unsafely) |

**Explicitly omitted from first migration:**

- **`raw_resume_text`** — structured skills only (see below)
- `job_analyses.resume_profile_id` FK (later migration)
- GIN indexes on jsonb (defer)
- Unique profile-name index (defer unless product decides now)

**Legacy reconciliation:** If the target database already has `resume_profiles` with `label` + `resume_text` from an early `schema.sql` apply, the first migration must be an **ALTER/replace plan**, not a blind `CREATE TABLE`. Inspect staging/production schema before writing the migration file.

---

## What must not be included in the first migration

- Raw resume text storage
- Raw job-description storage
- Uploaded file persistence
- PDF/DOCX parsing
- AI / semantic matching
- Profile UI or dashboard sections
- TypeScript Supabase helpers
- Application tracking features
- Service-role key usage from browser (never)
- Broad rewrites of `job_analyses`, `analysis_runs`, or unrelated tables
- Dropping or truncating existing user data without explicit plan

---

## Data model readiness

| Field | Ready? | Notes |
|-------|--------|-------|
| `profile_name` | Yes | Required; trim non-empty CHECK in draft |
| `profile_description` | Yes | Optional nullable text |
| `extracted_skills` | Yes | `jsonb` array; `{ skill, category }` objects |
| `user_added_skills` | Yes | Separate from extracted; merge in app layer |
| `source_type` | Yes | `manual`, `pasted`, `txt_upload`, `demo`, `imported` |
| `created_at` / `updated_at` | Yes | Standard timestamps; trigger if function exists |
| **Ownership** | Yes | **`clerk_user_id` text NOT NULL** — not `user_id`; matches saved analyses |
| **Unique names per user** | Defer | Optional unique index commented out — enable later if UX requires |
| **GIN indexes** | Defer | No query pattern requiring them yet |
| **`raw_resume_text`** | **Omitted** | Correct for v1; reduces privacy scope |

**Open implementation note (post-migration, pre-UI):** Skill extraction from pasted resume for profile create must not persist paste text—document in helper design (Step 13+).

---

## RLS readiness

| Question | Assessment |
|----------|------------|
| SELECT/INSERT/UPDATE/DELETE intent clear? | **Yes** — draft policies are complete for a standalone owned table |
| Mirrors saved analyses? | **Yes in repo** — same predicate and `TO authenticated` |
| Exact predicate confirmed? | **Yes** — hosted Supabase matches repo |
| Two-user test required after migration? | **Yes — mandatory** before helpers/UI |
| TODOs in SQL draft? | **Yes** — production predicate copy-if-different; legacy table check |

### Confirmed in repository

```sql
clerk_user_id = (select auth.jwt()->>'sub')
```

Policies: `TO authenticated`; names `resume_profiles_*_own`.

### Confirmed on hosted Supabase (June 2026)

```sql
clerk_user_id = (select auth.jwt() ->> 'sub'::text)
```

Policies: `TO authenticated`; names `resume_profiles_*_own` on existing legacy table. Migration file recreates the same predicate.

---

## Privacy readiness

| Requirement | Status |
|-------------|--------|
| Structured-skills-first | Planned and reflected in draft |
| No raw resume text by default | **Yes — omitted from draft** |
| One-time paste/upload analysis | Unchanged; no migration dependency |
| Delete/export before public profile release | Designed; **not built** — required before UI |
| Privacy/data-control copy update | **Required** before exposing profile save to users (`/privacy`, dashboard) |
| Version 16 production gaps (rate limits, formal policy) | Still relevant; profiles add sensitivity but v1 avoids raw text |

Profile **schema** migration alone does not expose profiles to users (no UI). Privacy copy must be ready **before** Step 14+ UI.

---

## Implementation readiness — Step 11 status

| Step | Status |
|------|--------|
| **Step 11 — Create structured resume-profile migration file** | **Complete** — [`web/database/migrations/20260617_structured_resume_profiles.sql`](../web/database/migrations/20260617_structured_resume_profiles.sql) (ALTER path; not applied) |
| **Step 12 — Apply migration on staging** | **Next** — manual SQL editor apply; then two-user RLS test |
| **Step 13+** | Typed helpers, then UI, then privacy copy before user-facing profile save |

Conservative sequence:

1. ~~Confirm live predicate~~ — confirmed on hosted Supabase (`auth.jwt() ->> 'sub'`).
2. ~~Author migration file~~ — done (Step 11).
3. **Step 12:** Apply to **staging** Supabase only; run post-migration verification below.
4. **Step 13:** Two-user RLS test on `resume_profiles`.
5. **Step 14+:** Typed helpers, then UI, then privacy copy before user-facing profile save.

---

## Required verification immediately after actual migration

Run on **staging** (then production) after migration apply:

| # | Check |
|---|--------|
| 1 | Table `public.resume_profiles` exists with expected columns |
| 2 | `raw_resume_text` column **absent** |
| 3 | RLS enabled on `resume_profiles` |
| 4 | Four policies present (`select`, `insert`, `update`, `delete` own) |
| 5 | User A: INSERT profile with `clerk_user_id` = Clerk `userId` |
| 6 | User A: SELECT / UPDATE / DELETE own profile succeeds |
| 7 | User B: cannot SELECT / UPDATE / DELETE User A’s profile |
| 8 | Existing hosted flows unchanged: one-time analysis, save/read/delete saved analyses |
| 9 | No service-role key in browser (unchanged) |
| 10 | `cd web && npm run lint && npm run build` still passes |
| 11 | `python3 run_tests.py` / `pytest api/tests` still pass |
| 12 | Repo hygiene: no `.env` commits, no private resume files |

Document results in a short post-migration note or checkpoint when migration lands.

---

## Migration readiness checklist

Use before authoring/applying the real migration file:

- [ ] **Exact ownership field confirmed:** `clerk_user_id` text (Clerk `userId` / JWT `sub`)
- [x] **Exact RLS predicate confirmed on target Supabase** (`clerk_user_id = (select auth.jwt() ->> 'sub'::text)` on `resume_profiles` and `job_analyses`)
- [x] **SQL draft reviewed:** [`sql/resume_profiles_schema_rls_draft.sql`](sql/resume_profiles_schema_rls_draft.sql)
- [x] **Migration file authored:** [`web/database/migrations/20260617_structured_resume_profiles.sql`](../web/database/migrations/20260617_structured_resume_profiles.sql)
- [ ] **Raw resume text omitted** from migration scope
- [ ] **No destructive SQL** (no `DROP` of user tables without plan)
- [ ] **Rollback understood:** new table can be dropped in staging if empty; production needs care
- [x] **Legacy `resume_profiles` inspected** — empty table; **ALTER** path in migration file
- [ ] **`set_updated_at()` exists** or migration includes idempotent function create
- [ ] **Two-user RLS test plan ready** (extend smoke test §8 for profiles)
- [ ] **No service-role key in browser** (unchanged policy)
- [ ] **Privacy/data-control update planned** before profile UI
- [ ] **Export/delete behavior planned** per design doc (helpers/UI later)
- [ ] **Staging apply before production**

**Current checklist status (Step 11):** Migration file authored; **staging apply** and **two-user RLS test** remain open.

---

## Final recommendation

**Version 17 Step 11 is complete:** migration file exists at `web/database/migrations/20260617_structured_resume_profiles.sql`. **Do not apply** until reviewed.

**Recommended next step:**

**Version 17 Step 12 — Apply migration on staging** (Supabase SQL editor; run post-migration verification and two-user RLS test below).

Do **not** ship profile UI or helpers in the same step as the migration. Do **not** claim production readiness or a completed security audit.

---

## Document maintenance

Update when migration is applied (staging/production), when scope changes, or after post-migration verification. Step 11 migration file: `web/database/migrations/20260617_structured_resume_profiles.sql`.
