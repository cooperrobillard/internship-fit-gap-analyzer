# Cloud saved-analysis write path (design)

Concise design for the **first cloud save** flow. This document and [`save-analysis-contract.ts`](../src/lib/supabase/save-analysis-contract.ts) define the contract only — **nothing is persisted yet**.

## Goal

Let a signed-in user save the **structured result** of one resume-vs-job analysis to Supabase: metadata, skill counts, and per-skill rows — without storing raw resume or job body text in the first hosted write path.

## Planned insert order

All inserts run as the authenticated Clerk user (`clerk_user_id` from JWT `sub`). RLS policies in `schema.sql` must allow insert only for that user.

1. **`analysis_runs`** — create the parent session row (`run_label`; `resume_profile_id` null for v1).
2. **`job_analyses`** — create one job result linked to `analysis_run_id` (metadata + counts; **no `job_text`**).
3. **`matched_skills`** — insert one row per matched skill, linked to `job_analysis_id`.
4. **`skill_gaps`** — insert one row per missing skill, linked to `job_analysis_id`.

Use a single transaction in Step 7 so a partial failure does not leave orphan rows.

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

## Next implementation step

**Version 12 Step 7:** implement the actual Supabase insert helper that:

1. Accepts `CloudAnalysisSaveInput` and a Clerk-aware client.
2. Calls `buildCloudAnalysisWritePlan()`.
3. Inserts rows in the order above (transaction).
4. Is exposed behind a **small test/dev-only control** or controlled dashboard action — not automatic production saving until reviewed.

No Python analysis API required for Step 7 if the UI passes structured skill arrays from a future analysis call; Python service integration remains a separate milestone.
