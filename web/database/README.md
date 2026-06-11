# Supabase / Postgres schema (draft)

This folder holds a **first-pass cloud database schema** for the future hosted Internship Fit & Skill-Gap Analyzer. It is design documentation in SQL form—you apply it manually in Supabase; migrations tooling is not added yet.

## What exists today

- [`schema.sql`](schema.sql) — tables, indexes, RLS policies for user-owned saved analyses
- Clerk auth shell in the Next.js app (`web/src/`) — sign-in, sign-up, protected `/dashboard`
- **Version 12 Step 4:** `@supabase/supabase-js` browser client (`web/src/lib/supabase/client.ts`) and dashboard **read-only** status check (count on `job_analyses`)
- **Version 12 Step 5:** read-only saved-analysis list from `job_analyses` (`web/src/lib/supabase/saved-analyses.ts`) — first table read as a list, not only a count
- **Version 12 Step 6:** write-path design — [`WRITE_PATH.md`](WRITE_PATH.md) and [`save-analysis-contract.ts`](../src/lib/supabase/save-analysis-contract.ts) (first write path avoids raw resume/job text)
- **Version 12 Step 7:** insert helper — [`save-analysis.ts`](../src/lib/supabase/save-analysis.ts) (`saveCloudAnalysis`; not wired to dashboard UI yet)

## What is not implemented yet

- User-facing cloud save from the dashboard (helper exists for programmatic/dev use only)
- Python analysis API or cloud save flow

**User-facing cloud saving does not work yet** (no save button in the UI). The working analyzer remains the Python CLI and local Streamlit app at the repository root.

## Schema overview

| Table | Purpose |
|-------|---------|
| `profiles` | One app profile per Clerk user |
| `resume_profiles` | Saved resume versions (optional `resume_text`) |
| `analysis_runs` | Groups one or more job analyses in a session |
| `job_analyses` | Single job posting result (metadata, counts, optional `job_text`) |
| `skill_gaps` | Normalized missing skills per job analysis |
| `matched_skills` | Normalized matched skills per job analysis |

`clerk_user_id` (text) is duplicated on child tables so RLS can enforce ownership without expensive joins on every policy.

## Row Level Security (RLS)

RLS is enabled on all tables. Policies assume:

```sql
clerk_user_id = (select auth.jwt()->>'sub')
```

That requires Supabase to accept Clerk session tokens and expose the Clerk user ID as the JWT `sub` claim. **Test policies in a dev Supabase project** before trusting them in production.

Child-table `INSERT` policies also verify the parent row belongs to the same user (e.g. `job_analyses.analysis_run_id` → `analysis_runs`).

## Privacy caution

`resume_text` and `job_text` are included so the hosted app could re-display postings and support future re-analysis. They are **sensitive PII**:

- Local Streamlit/SQLite intentionally avoids storing raw resume and job body text in many flows.
- Before public launch, decide whether to encrypt, minimize, store hashes only, or omit these columns.
- Do not log full text in application or analytics pipelines.

See comments at the top of `schema.sql` for the full design note.

## Applying the schema (manual, when ready)

1. Create a **development** Supabase project.
2. Configure Clerk as a third-party JWT provider in Supabase (per Clerk + Supabase docs).
3. Run `schema.sql` in the Supabase SQL editor (or via migration tooling later).
4. Sign in as a test user and verify SELECT/INSERT/DELETE with a Clerk JWT—not the service role key from the browser.

## Recommended next step

**Next:** wire `saveCloudAnalysis()` behind a controlled dev/test dashboard action or future analysis flow — see [`WRITE_PATH.md`](WRITE_PATH.md).

Env vars (in `web/.env.example`, values in `.env.local` only):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Use the Supabase **publishable (anon)** key in the browser; never expose the service role key client-side.
