# Supabase / Postgres schema (draft)

This folder holds a **first-pass cloud database schema** for the future hosted Internship Fit & Skill-Gap Analyzer. It is design documentation in SQL form—not a live database and not wired into the Next.js app yet.

## What exists today

- [`schema.sql`](schema.sql) — tables, indexes, RLS policies for user-owned saved analyses
- Clerk auth shell in the Next.js app (`web/src/`) — sign-in, sign-up, protected `/dashboard`

## What is not implemented yet

- Supabase project connection or `@supabase/supabase-js` client
- Environment variables for Supabase URL / anon key in the app
- Clerk ↔ Supabase JWT integration (third-party auth)
- Reading or writing any rows from the dashboard
- Python analysis API or cloud save flow

**Cloud saving does not work.** The working analyzer remains the Python CLI and local Streamlit app at the repository root.

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

**Version 12 Step 4 (or equivalent):** add Supabase client/env scaffolding in the Next.js app and test an **empty** signed-in dashboard query (e.g. list zero `job_analyses` rows) to prove Clerk token → Supabase RLS works—still without saving real analyses.

Future env placeholders (not added to the app yet):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Use the Supabase **anon** key in the browser; never expose the service role key client-side.
