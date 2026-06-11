# Internship Fit & Skill-Gap Analyzer — Web Frontend

This folder is the **future hosted web-app frontend** for the Internship Fit & Skill-Gap Analyzer. It is a Next.js app that will eventually replace the localhost-only experience with a portfolio-ready hosted product.

## What exists today

- Landing page describing the planned hosted product
- **Clerk authentication shell** — sign-in, sign-up, protected dashboard route, header nav with `UserButton`
- Dashboard placeholder cards (no real data or cloud saving)
- **Draft Supabase/Postgres schema** — [`database/schema.sql`](database/schema.sql) and [`database/README.md`](database/README.md)
- **Supabase client scaffolding** — Clerk-aware browser client, read-only status check, and read-only saved-analysis list from `job_analyses` (metadata/counts only)
- **Cloud save write contract** — [`src/lib/supabase/save-analysis-contract.ts`](src/lib/supabase/save-analysis-contract.ts) and [`database/WRITE_PATH.md`](database/WRITE_PATH.md)
- **Supabase insert helper** — [`src/lib/supabase/save-analysis.ts`](src/lib/supabase/save-analysis.ts) (`saveCloudAnalysis`)
- **Dashboard test cloud save** — controlled sample/mock save on `/dashboard` to verify Clerk + Supabase + RLS writes (not real analysis)
- **Web analysis prototype** — pasted resume/job text analyzed in-browser via [`src/lib/analysis/demo-rule-analyzer.ts`](src/lib/analysis/demo-rule-analyzer.ts) (temporary adapter; does not save pasted text)

## What is not implemented yet

- Cloud saving of real web analysis results (test save writes sample rows only)
- Python analysis API or service integration (full analyzer remains in repo `src/`)
- Saving, comparing, or loading real analyses from this UI
- Billing, organizations, or deployment configuration

The **working analyzer** remains the Python CLI and local Streamlit app at the repository root. Use those for real analyses until later branches wire this frontend to a backend.

## Run locally

From this `web/` directory:

```bash
npm install
```

Create `web/.env.local` from the example file and add your Clerk development keys:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — from the [Clerk Dashboard](https://dashboard.clerk.com/) (development instance)
- `CLERK_SECRET_KEY` — from the same Clerk application
- `NEXT_PUBLIC_SUPABASE_URL` — Project URL from your [Supabase](https://supabase.com/) project
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Publishable (anon) key from the same project

The sign-in/sign-up URLs and fallback redirects are already documented in `.env.example`.

### Supabase setup (manual, for connection check)

1. Create a **development** Supabase project.
2. Run [`database/schema.sql`](database/schema.sql) in the Supabase SQL editor.
3. Configure **Clerk as a Supabase third-party auth provider** (see [Clerk + Supabase docs](https://clerk.com/docs/guides/development/integrations/databases/supabase)).
4. Copy Project URL and Publishable key into `web/.env.local`.

The signed-in dashboard runs a **read-only count** and can **list recent `job_analyses` rows** (safe fields only) when schema and RLS are configured. **Cloud saving is not implemented yet.** Python analyzer integration is not implemented yet. Do not use the Supabase service role key in browser code.

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other useful commands:

```bash
npm run lint
npm run build
```

`npm run build` requires valid Clerk keys in `.env.local`.

## Auth routes

| Route | Access |
|-------|--------|
| `/` | Public landing page |
| `/sign-in` | Public Clerk sign-in |
| `/sign-up` | Public Clerk sign-up |
| `/dashboard` | Protected — requires sign-in |

Route protection is handled in `src/proxy.ts` (Next.js 16 network boundary).

## Environment files

- Commit `.env.example` (placeholders only)
- **Do not commit** `.env.local` or any file containing `CLERK_SECRET_KEY`

## Database schema (draft)

See [`database/README.md`](database/README.md) for the first-pass Postgres design: user-owned `profiles`, `resume_profiles`, `analysis_runs`, `job_analyses`, `skill_gaps`, and `matched_skills` with Clerk-based RLS. The dashboard **reads** `job_analyses` list metadata when configured; **cloud saving is not implemented**.

## Related docs

Architecture and deployment planning for the hosted version live in the repo root under `docs/` (outside this folder). This README covers only the Next.js frontend.
