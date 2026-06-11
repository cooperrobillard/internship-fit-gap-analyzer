# Cloud saved-analysis write path (design)

Concise design for the **first cloud save** flow. The write contract lives in [`save-analysis-contract.ts`](../src/lib/supabase/save-analysis-contract.ts). **Step 7** added [`save-analysis.ts`](../src/lib/supabase/save-analysis.ts) (`saveCloudAnalysis`) — the first insert helper. It is **not wired to the dashboard UI yet**.

## Goal

Let a signed-in user save the **structured result** of one resume-vs-job analysis to Supabase: metadata, skill counts, and per-skill rows — without storing raw resume or job body text in the first hosted write path.

## Planned insert order

All inserts run as the authenticated Clerk user (`clerk_user_id` from JWT `sub`). RLS policies in `schema.sql` must allow insert only for that user.

1. **`analysis_runs`** — create the parent session row (`run_label`; `resume_profile_id` null for v1).
2. **`job_analyses`** — create one job result linked to `analysis_run_id` (metadata + counts; **no `job_text`**).
3. **`matched_skills`** — insert one row per matched skill, linked to `job_analysis_id`.
4. **`skill_gaps`** — insert one row per missing skill, linked to `job_analysis_id`.

The helper inserts sequentially (browser client has no SQL transaction). On failure after the parent `analysis_runs` row exists, it **best-effort deletes** that run so `ON DELETE CASCADE` removes child rows.

## Tables touched

| Table | First write path |
|-------|------------------|
| `analysis_runs` | Yes |
| `job_analyses` | Yes |
| `matched_skills` | Yes |
| `skill_gaps` | Yes |
| `profiles` | No (optional later on first sign-in) |
| `resume_profiles` | No (v1 skips resume storage) |

## Fields saved

From analyzer output via `CloudAnalysisSaveInput` / `buildCloudAnalysisWritePlan()`:

- **Run:** `run_label`
- **Job:** `job_title`, `company`, `source_url`, `notes`, `matched_skills_count`, `missing_skills_count`
- **Skills:** `skill`, `category` on `matched_skills` and `skill_gaps`

Blank optional strings become `null` before insert.

## Fields intentionally not saved (v1)

| Field | Reason |
|-------|--------|
| `resume_text` | Sensitive PII; local Streamlit often avoids storing body text |
| `job_text` | Sensitive posting content; column exists in schema for a possible later phase |
| `resume_profile_id` | Resume profiles deferred until storage policy is decided |

## Privacy rationale

Internship search data is sensitive. The first hosted write path stores **derived results** (skill names, categories, optional labels/URLs/notes) so the dashboard read model can list and compare analyses without holding full resume or posting bodies in the cloud. Encryption, minimization, or a later opt-in for text storage can be decided before public launch.

## Expected Supabase / RLS behavior

- Browser client uses Clerk session token + publishable key (never service role in the UI).
- Each inserted row sets `clerk_user_id` to the signed-in user.
- Child inserts must reference parent rows owned by the same user (policies already check parent ownership in `schema.sql`).

## Step 7 — insert helper (implemented)

[`save-analysis.ts`](../src/lib/supabase/save-analysis.ts) exports `saveCloudAnalysis(supabase, clerkUserId, input)`:

| Behavior | Detail |
|----------|--------|
| Insert order | `analysis_runs` → `job_analyses` → `matched_skills` → `skill_gaps` |
| Raw text | Does **not** insert `resume_text` or `job_text` (`job_text` column omitted) |
| Cleanup | On child insert failure, deletes the `analysis_runs` row when possible; safe error if cleanup fails |
| UI | **Not connected** — helper only; future Step 8+ can add a dev/test save control |
| Auth | Caller supplies Clerk-authenticated Supabase client + `clerkUserId`; assumes RLS |

## Step 8 — dashboard test save (implemented)

The signed-in dashboard includes **Test cloud save** ([`test-save-action.tsx`](../src/app/dashboard/test-save-action.tsx)):

| Behavior | Detail |
|----------|--------|
| Purpose | Exercises `saveCloudAnalysis()` with a fixed sample `CloudAnalysisSaveInput` |
| Data | Metadata + skill rows only — **no** raw resume or job text |
| Honesty | Labeled as test/scaffold; not the real analysis workflow |
| After save | Saved analyses list refreshes via a simple `refreshKey` |

## Step 9 — web analysis boundary (implemented)

[`analysis-form.tsx`](../src/app/dashboard/analysis-form.tsx) and [`demo-rule-analyzer.ts`](../src/lib/analysis/demo-rule-analyzer.ts) produce `WebAnalysisResult` (matched/missing skills) from pasted text in the browser.

| Behavior | Detail |
|----------|--------|
| Output shape | Aligns with cloud save contract (`AnalysisSkill` ≈ `SkillResult`) |
| Persistence | **Does not** save pasted text or connect results to `saveCloudAnalysis` yet |
| Analyzer | Temporary demo taxonomy—not the full Python `src/` analyzer |

## Next implementation step

Map **`WebAnalysisResult` → `saveCloudAnalysis`** (skills + metadata only, no raw text) after reviewing the boundary—or replace the demo adapter with a Python analysis service. Python service integration remains a separate milestone.
