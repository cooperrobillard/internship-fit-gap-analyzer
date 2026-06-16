# Saved Analysis RLS Pattern Review

**Status:** Review/documentation only · **No schema changes** · **No RLS changes** · **No resume-profile implementation**

**Product:** Job Fit & Skill-Gap Analyzer (hosted prototype)  
**Repository:** internship-fit-gap-analyzer

Related: [`RESUME_PROFILE_SCHEMA_RLS_DRAFT.md`](RESUME_PROFILE_SCHEMA_RLS_DRAFT.md), [`RESUME_PROFILE_SCHEMA_RLS_PLAN.md`](RESUME_PROFILE_SCHEMA_RLS_PLAN.md), [`PERSISTENT_RESUME_PROFILE_DESIGN.md`](PERSISTENT_RESUME_PROFILE_DESIGN.md), [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md), [`VERSION_16_PRODUCTION_READINESS_REVIEW.md`](VERSION_16_PRODUCTION_READINESS_REVIEW.md), `web/database/schema.sql`, `web/database/README.md`, `web/database/WRITE_PATH.md`.

---

## Summary

Future **resume profiles** should reuse the same **user-ownership and RLS pattern** as hosted **saved analyses**—not invent a parallel auth model.

This review documents how saved analyses work today in the repository: Clerk identity, Supabase browser client, `clerk_user_id` on rows, RLS policies keyed to JWT `sub`, and client-side helper functions. It is input for updating the resume-profile SQL draft and for any later migration.

**Caveat:** Policies in `web/database/schema.sql` are a **repository first-pass draft**. The exact policies on a **deployed** Supabase project should be confirmed in the Supabase dashboard before applying new tables.

---

## Current saved-analysis data flow

### Sign-in and identity

1. User signs in via **Clerk** on the Next.js app (`/sign-in`, `/sign-up`).
2. Protected routes (e.g. `/dashboard`) require authentication (Clerk middleware / `auth()`).
3. Client components use **`useAuth()`** and **`useSession()`** from `@clerk/nextjs`.
4. **`userId`** from `useAuth()` is the Clerk user id passed into save helpers as `clerkUserId`.

### Supabase client (browser)

1. Dashboard code calls **`createClerkSupabaseClient(() => session.getToken())`** (`web/src/lib/supabase/client.ts`).
2. Client uses **`NEXT_PUBLIC_SUPABASE_URL`** and **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** (anon/publishable key only).
3. Each request sends the **Clerk session token** via Supabase client `accessToken()` — not the service-role key.
4. **`persistSession: false`** — Supabase auth session is not persisted separately; Clerk owns the session.

### Save (create)

| Step | Detail |
|------|--------|
| **Trigger** | User runs analysis, then clicks **Save structured results** in `analysis-form.tsx`, or **Test cloud save** in `test-save-action.tsx` |
| **Helper** | `saveCloudAnalysis(supabase, clerkUserId, input)` in `web/src/lib/supabase/save-analysis.ts` |
| **Mapping** | `mapWebAnalysisToCloudSaveInput()` builds `CloudAnalysisSaveInput` (no raw resume/job text) |
| **Insert order** | `analysis_runs` → `job_analyses` → `matched_skills` → `skill_gaps` |
| **Ownership** | Every inserted row sets **`clerk_user_id: userId`** from Clerk |
| **Location** | **Client-side** in the browser (no dedicated Next.js API route for save) |
| **Rollback** | On child insert failure, best-effort delete of parent `analysis_runs` row (CASCADE cleans children) |
| **Raw text** | **`job_text` omitted**; no resume body columns written |

### Read (list and detail)

| Step | Detail |
|------|--------|
| **List** | `fetchRecentSavedAnalyses(getAccessToken)` in `web/src/lib/supabase/saved-analyses.ts` |
| **Detail** | `fetchSavedAnalysisDetail(getAccessToken, analysisId)` |
| **Query** | `from("job_analyses").select(...)` with explicit column list — **excludes `job_text`** |
| **User filter** | **No `.eq("clerk_user_id", …)` in app code** — relies on **RLS** to return only the signed-in user's rows |
| **Location** | Client-side; dashboard panels call helpers with `session.getToken()` |
| **Recurring gaps** | `fetchRecurringGapStats()` reads `skill_gaps` for the user (RLS-scoped) and aggregates client-side |

### Delete

| Step | Detail |
|------|--------|
| **Helper** | `deleteSavedAnalysis(getAccessToken, analysisId)` |
| **Action** | `DELETE` from **`job_analyses`** where `id` matches |
| **Cascade** | `matched_skills` and `skill_gaps` delete via FK CASCADE per `schema.sql` |
| **Parent run** | **`analysis_runs` row is not deleted** by current helper (orphan run possible; separate cleanup not implemented) |
| **User filter** | RLS on delete; lookup uses `.eq("id", trimmedId)` only |
| **Location** | Client-side from `saved-analysis-detail.tsx` |

### Update

- **`job_analyses` UPDATE policy exists** in `schema.sql`, but **no hosted helper or UI updates saved analyses** today. Saved analyses are effectively append + delete.

---

## Current user-id field/pattern

| Question | Answer |
|----------|--------|
| **Ownership column name** | **`clerk_user_id`** (`text`, NOT NULL) on `analysis_runs`, `job_analyses`, `matched_skills`, `skill_gaps` |
| **Not used** | Generic `user_id` — repo consistently uses **`clerk_user_id`** |
| **Value source** | Clerk **`userId`** from `useAuth()` / JWT **`sub`** claim |
| **On insert** | `saveCloudAnalysis` sets `clerk_user_id: clerkUserId.trim()` on every row in the write plan |
| **On read** | Helpers do **not** pass `clerk_user_id` in `WHERE`; RLS restricts rows |
| **On delete cleanup** | `cleanupAnalysisRun` uses `.eq("clerk_user_id", clerkUserId)` when rolling back failed saves |
| **Duplication** | `clerk_user_id` is duplicated on child tables so policies avoid joins (documented in `web/database/README.md`) |

Clerk user ids are **strings** (e.g. `user_…`), not UUIDs — see comments in `schema.sql`.

---

## Current RLS policy pattern

**Source in repo:** `web/database/schema.sql` (lines ~175–363) and `web/database/README.md`.

### Predicate (confirmed in repository)

```sql
clerk_user_id = (select auth.jwt()->>'sub')
```

Policies are created **`TO authenticated`** on saved-analysis-related tables.

### `job_analyses` policies

| Operation | Policy name (repo) | Intent |
|-----------|-------------------|--------|
| **SELECT** | `job_analyses_select_own` | Own rows only |
| **INSERT** | `job_analyses_insert_own` | `clerk_user_id` matches JWT `sub` **and** parent `analysis_runs` row belongs to same user |
| **UPDATE** | `job_analyses_update_own` | Same ownership + parent run ownership |
| **DELETE** | `job_analyses_delete_own` | Own rows only |

### Parent/child insert checks

- **`job_analyses` INSERT** requires matching `analysis_run_id` owned by the same `clerk_user_id`.
- **`matched_skills` / `skill_gaps` INSERT** require parent `job_analyses` owned by the same user.
- **`skill_gaps` / `matched_skills`**: SELECT, INSERT, DELETE policies — **no UPDATE** policies in repo sketch.

### `analysis_runs` policies

- Full SELECT / INSERT / UPDATE / DELETE own rows.
- INSERT/UPDATE also validate optional `resume_profile_id` references a profile owned by the same user (when not null).

### Legacy `resume_profiles` policies in `schema.sql`

The first-pass sketch already defines **`resume_profiles_*_own`** policies using the **same predicate** as `job_analyses`. That table shape in `schema.sql` uses **`label` + `resume_text`** — **not** the Version 17 structured-skills draft. Policy *pattern* matches; **table columns do not**.

### Production confirmation

| Confirmed from repo | Needs Supabase dashboard check |
|---------------------|--------------------------------|
| Predicate expression in `schema.sql` | Whether production project applied this file verbatim |
| `TO authenticated` role on policies | Whether Clerk JWT maps to `authenticated` role as expected |
| JWT `sub` = Clerk user id | Clerk third-party auth / JWT template configuration |

**Do not assume** production matches the repo file without verification.

---

## Current helper patterns

Future resume-profile helpers should **imitate** these files and conventions:

| File | Role | Pattern to copy |
|------|------|-----------------|
| `web/src/lib/supabase/client.ts` | `createClerkSupabaseClient`, `isSupabaseConfigured` | Clerk token + publishable key only |
| `web/src/lib/supabase/save-analysis-contract.ts` | `CloudAnalysisSaveInput`, `buildCloudAnalysisWritePlan` | Typed write contract; sensitive fields excluded |
| `web/src/lib/supabase/save-analysis.ts` | `saveCloudAnalysis` | `(supabase, clerkUserId, input)` → discriminated result; sets `clerk_user_id` on inserts |
| `web/src/lib/supabase/saved-analyses.ts` | `fetchRecentSavedAnalyses`, `fetchSavedAnalysisDetail`, `deleteSavedAnalysis` | `(getAccessToken, …)` → `{ status, … }`; safe column lists; calm errors |
| `web/src/lib/supabase/supabase-errors.ts` | `getSafeSavedAnalysisErrorMessage` | No secrets/stack traces in UI messages |
| `web/src/lib/supabase/recurring-gap-stats.ts` | `fetchRecurringGapStats` | Read child table, RLS-scoped |
| `web/src/lib/analysis/to-cloud-save-input.ts` | Maps analysis → save input | Excludes `resumeText` / `jobText` |

### Conventions for future profile helpers

1. **`createClerkSupabaseClient(() => session.getToken())`** for all browser Supabase access.
2. Pass **`clerkUserId`** from `useAuth().userId` on writes (validate non-empty).
3. Return **discriminated unions** (`status: "success" | "error" | "not_configured" | "not_found"`).
4. **Select explicit columns** — avoid `select("*")` on tables that may gain sensitive columns later.
5. **Rely on RLS** for read isolation; optional `.eq("clerk_user_id", clerkUserId)` is defense-in-depth but not used today on reads.
6. **No service-role key** in browser code.

Suggested future names (not implemented): `listResumeProfiles`, `createResumeProfile`, `updateResumeProfile`, `deleteResumeProfile`, `exportResumeProfile` — mirroring `saved-analyses.ts` + `save-analysis.ts` style.

---

## Current two-user/RLS verification evidence

| Evidence type | What exists |
|---------------|-------------|
| **Manual smoke test** | [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md) **§8 RLS / user isolation check** — User A saves, User B must not see User A’s rows |
| **Deployment docs** | [`VERSION_13_DEPLOYMENT_PATH.md`](VERSION_13_DEPLOYMENT_PATH.md), [`VERCEL_FRONTEND_DEPLOYMENT.md`](VERCEL_FRONTEND_DEPLOYMENT.md) — remind to verify Clerk + RLS |
| **Checkpoints** | [`VERSION_15_CHECKPOINT.md`](VERSION_15_CHECKPOINT.md), [`VERSION_16_PRODUCTION_READINESS_REVIEW.md`](VERSION_16_PRODUCTION_READINESS_REVIEW.md) — RLS noted as manually verified / needs re-check after schema changes |
| **Automated RLS tests** | **None found** in repo (no CI test that signs in as two users against Supabase) |

Isolation is **documented as a manual pre-demo check**, not enforced by automated tests.

---

## Implications for resume profiles

| Area | Alignment |
|------|-----------|
| **Ownership column** | Use **`clerk_user_id` text NOT NULL** — not `user_id` |
| **RLS predicate** | **`clerk_user_id = (select auth.jwt()->>'sub')`** with **`TO authenticated`** to match `schema.sql` |
| **Policies** | SELECT, INSERT, UPDATE, DELETE own rows; naming `resume_profiles_{select,insert,update,delete}_own` |
| **Helpers** | `createClerkSupabaseClient` + `clerkUserId` param + discriminated results + safe column lists |
| **Reads** | RLS-only filtering acceptable (current pattern); profile list need not `.eq` if policies are correct |
| **Writes** | Set `clerk_user_id` from Clerk on every insert/update |
| **Sensitive data** | Structured skills only in v1; no raw resume text |
| **Verification** | Repeat **two-user manual check** before enabling profile UI; add profile scenarios to smoke test |
| **Legacy table** | If deployed DB has old `resume_profiles` (`resume_text`), migration must replace shape — policies alone are insufficient |

When linking profiles to analyses later, mirror **`analysis_runs.resume_profile_id`** FK check: referenced profile must belong to same `clerk_user_id`.

---

## Updates needed to the resume-profile SQL draft

Compared with [`RESUME_PROFILE_SCHEMA_RLS_DRAFT.md`](RESUME_PROFILE_SCHEMA_RLS_DRAFT.md) and [`sql/resume_profiles_schema_rls_draft.sql`](sql/resume_profiles_schema_rls_draft.sql):

| Finding | Draft status | Recommended update (Step 9) |
|---------|--------------|----------------------------|
| **Ownership column `clerk_user_id`** | Already uses `clerk_user_id` | No change |
| **RLS predicate** | Uses `(SELECT auth.jwt() ->> 'sub')` | Add **`TO authenticated`** on each policy to match `schema.sql` |
| **Policy naming** | `resume_profiles_select_own`, etc. | Already aligned with `job_analyses_*_own` style |
| **UPDATE/DELETE policies** | Present in draft | Confirmed appropriate for profile CRUD |
| **`raw_resume_text`** | Omitted | Keep omitted |
| **TODO in draft SQL** | “Confirm JWT on Supabase” | Replace with reference to **this review** + dashboard verification step |
| **Placeholder auth** | Draft uses real repo expression, not placeholder | Mark as **repo-confirmed**; add note that **production** must be verified |
| **Legacy `schema.sql` resume_profiles** | Draft notes reconciliation | Step 9 should document **DROP/ALTER/migrate** plan if old table exists |

**This step does not edit the draft files** — Step 9 should apply the small `TO authenticated` alignment and production-verification notes.

---

## Risks and open questions

| Risk / question | Notes |
|-----------------|-------|
| **Production vs repo schema** | Deployed Supabase may differ from `web/database/schema.sql` |
| **JWT / `sub` claim** | Must match Clerk user id used in `useAuth().userId`; confirm in Supabase auth settings |
| **`authenticated` role** | Policies assume Clerk JWT yields `authenticated`; verify with a real token |
| **No automated RLS tests** | Manual two-user check must be repeated for profiles |
| **Service-role key** | Must never ship in browser; current client uses publishable key only |
| **Read without explicit user filter** | Correct only if RLS is enabled and policies applied |
| **Orphan `analysis_runs`** | Delete helper does not remove parent run; profile work should not worsen this |
| **Profile implementation gate** | Do not apply profile migration until ownership predicate confirmed on target project |

---

## Recommended next step

**Version 17 Step 9 — Update resume-profile schema/RLS draft to match saved-analysis pattern** (docs-only):

- Add `TO authenticated` to draft policies.
- Cross-link this review document.
- Document production verification checklist and legacy-table migration note.
- Keep **`raw_resume_text` omitted**.

**After Step 9:** **Version 17 Step 10 — create actual migration** (staging first) only when checklist is signed off. Still **no UI** until helpers exist.

---

## Document maintenance

Update when hosted save/read/delete patterns change, when production RLS is verified against this review, or when the resume-profile draft is revised.

Do not treat this review as a formal security audit or production-readiness sign-off.
