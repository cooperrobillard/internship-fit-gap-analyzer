# Internship Fit & Skill-Gap Analyzer — Web Frontend

This folder is the **future hosted web-app frontend** for the Internship Fit & Skill-Gap Analyzer. It is a Next.js app that will eventually replace the localhost-only experience with a portfolio-ready hosted product.

## What exists today

- Landing page describing the planned hosted product
- **Clerk authentication shell** — sign-in, sign-up, protected dashboard route, header nav with `UserButton`
- Dashboard with local FastAPI analysis, prototype cloud save, and saved-analyses read model
- **Draft Supabase/Postgres schema** — [`database/schema.sql`](database/schema.sql) and [`database/README.md`](database/README.md)
- **Supabase client scaffolding** — Clerk-aware browser client, read-only status check, and read-only saved-analysis list from `job_analyses` (metadata/counts only)
- **Cloud save write contract** — [`src/lib/supabase/save-analysis-contract.ts`](src/lib/supabase/save-analysis-contract.ts) and [`database/WRITE_PATH.md`](database/WRITE_PATH.md)
- **Supabase insert helper** — [`src/lib/supabase/save-analysis.ts`](src/lib/supabase/save-analysis.ts) (`saveCloudAnalysis`)
- **Dashboard test cloud save** — controlled sample/mock save on `/dashboard` to verify Clerk + Supabase + RLS writes (not real analysis)
- **Web analysis prototype** — dashboard form calls [`src/lib/analysis/api-analysis-client.ts`](src/lib/analysis/api-analysis-client.ts) (`POST /api/analyze`; Next.js forwards to FastAPI; does not save pasted text)
- **Web → cloud save mapping** — [`src/lib/analysis/to-cloud-save-input.ts`](src/lib/analysis/to-cloud-save-input.ts) maps `WebAnalysisInput` + `WebAnalysisResult` into `CloudAnalysisSaveInput` (skills + metadata only; raw pasted resume/job text is intentionally excluded)
- **Prototype analysis cloud save** — dashboard **Save this prototype analysis** runs the mapper + `saveCloudAnalysis` after analysis (matched/missing skills and optional metadata only)

## Hosted prototype status

The **hosted prototype** runs on **Vercel** (this app) + **Render** (FastAPI) + **Supabase** (database) + **Clerk** (auth). It is **not production-secure SaaS** yet — analysis uses a shared-secret validation layer between Vercel and Render, not full user-facing API auth, and a full privacy/security review is still outstanding.

- Use **generic sample text** in the hosted dashboard when demoing; avoid pasting sensitive resume or job descriptions into the public prototype.
- The FastAPI service analyzes pasted text **in memory** and does not intentionally persist raw resume/job body text, but the deployment should not be treated as safe for private data until API auth and policy work are complete.

See [`docs/VERSION_13_HOSTED_DEPLOYMENT_CHECKPOINT.md`](../docs/VERSION_13_HOSTED_DEPLOYMENT_CHECKPOINT.md) for deployment lessons and cleanup priorities.

## What is not implemented yet
- Production API authentication on Render
- Comparing or loading detailed skill rows from the saved list UI
- Billing, organizations, or deployment configuration

The Python CLI and local Streamlit app remain available for full offline workflows. Local development still uses FastAPI on port 8000; the browser calls `/api/analyze`, and the Next.js route handler forwards to FastAPI using `ANALYSIS_API_URL`.

## Run locally

From this `web/` directory:

```bash
npm install
```

Create `web/.env.local` from the example file and add your Clerk development keys:

```bash
cp .env.example .env.local
```

See [Vercel environment configuration](#vercel-environment-configuration) below for variable details. Copy from [`.env.example`](.env.example) and fill in Clerk and Supabase values from each provider’s dashboard.

### Supabase setup (manual, for connection check)

1. Create a **development** Supabase project.
2. Run [`database/schema.sql`](database/schema.sql) in the Supabase SQL editor.
3. Configure **Clerk as a Supabase third-party auth provider** (see [Clerk + Supabase docs](https://clerk.com/docs/guides/development/integrations/databases/supabase)).
4. Copy Project URL and publishable (anon) key into `web/.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

The signed-in dashboard runs a **read-only count** and can **list recent `job_analyses` rows** (safe fields only) when schema and RLS are configured. Prototype cloud save writes structured results only. Do not use the Supabase service role key in browser code.

### Local two-server workflow

The dashboard analysis form requires the FastAPI service running locally.

**Recommended shortcut (repository root):**

```bash
chmod +x scripts/run_local_full_stack_demo.sh
./scripts/run_local_full_stack_demo.sh
```

Starts FastAPI at http://127.0.0.1:8000 and Next.js at http://localhost:3000. Local development only. Clerk and Supabase need `web/.env.local` (the script warns if missing). Press **Control+C** to stop both.

**Manual two-terminal workflow:**

**Terminal 1 (repository root):**

```bash
python3 -m uvicorn api.main:app --reload --port 8000
```

Health check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

**Terminal 2:**

```bash
cd web
npm run dev
```

Next.js app: [http://localhost:3000](http://localhost:3000) — dashboard at `/dashboard`.

Sign in, paste resume/job text, and click **Analyze pasted text** (`POST /api/analyze` → FastAPI). Local prototype only — not deployed. **Save this prototype analysis** stores skills and metadata in Supabase; raw pasted text is not saved.

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

## Vercel environment configuration

**Local:** values go in `web/.env.local` (git-ignored). **Production:** set the same variable names in the Vercel project dashboard (Settings → Environment Variables). Do not deploy secrets in client bundles beyond what `NEXT_PUBLIC_*` already exposes.

### Vercel (required for hosted prototype)

| Variable | Local example | Production |
|----------|---------------|------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk development instance | Clerk production instance |
| `CLERK_SECRET_KEY` | Clerk secret (server only) | Clerk production secret (Vercel server env) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Same (hosted project) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key | Same (browser-safe key only) |
| `ANALYSIS_API_URL` | `http://127.0.0.1:8000` | Render FastAPI base URL (server only, no trailing slash) |
| `ANALYSIS_API_SHARED_SECRET` | (optional locally) | Same secret on Vercel and Render for hosted validation |

Optional Clerk route variables (`NEXT_PUBLIC_CLERK_SIGN_IN_URL`, etc.) are listed in `.env.example` with safe local defaults.

### Render (required for hosted prototype)

| Variable | Purpose |
|----------|---------|
| `ALLOWED_ORIGINS` | Comma-separated browser origins (Vercel production/preview URLs) |
| `ANALYSIS_API_SHARED_SECRET` | Same value as Vercel when hosted validation is enabled |

**Safety rules:**

- `NEXT_PUBLIC_*` variables are **browser-visible** — only put values safe to expose (publishable keys, public URLs).
- Never put `CLERK_SECRET_KEY`, `ANALYSIS_API_URL`, or `ANALYSIS_API_SHARED_SECRET` in client code or `NEXT_PUBLIC_*` names.
- Never use the Supabase **service role** key in the browser — use the publishable (anon) key only.
- `ANALYSIS_API_URL` must point at a running FastAPI service; the dashboard analysis form fails if the API is unreachable.
- Set `ANALYSIS_API_SHARED_SECRET` on both Vercel and Render with the same value to enable hosted request validation.

Centralized reader: [`src/lib/env-config.ts`](src/lib/env-config.ts) (`getSupabaseAnonKey`). Legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is still accepted as a fallback for local `.env.local` files during migration.

### Hosted analysis troubleshooting

If **Analyze pasted text** fails on Vercel, the dashboard shows a short error near the form. Common causes: Render is waking up from sleep (retry after ~30 seconds), `ANALYSIS_API_URL` is missing or wrong on Vercel, `ANALYSIS_API_SHARED_SECRET` does not match between Vercel and Render, or the FastAPI service is down. Confirm `GET /health` on Render and redeploy after env changes.

### Hosted save/read troubleshooting

If **Save this prototype analysis** or the saved analyses list fails, check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` on Vercel, confirm Clerk is configured as a Supabase third-party auth provider, and verify RLS policies from `web/database/schema.sql` are applied. Retry after signing in again.

## Database schema (draft)

See [`database/README.md`](database/README.md) for the first-pass Postgres design: user-owned `profiles`, `resume_profiles`, `analysis_runs`, `job_analyses`, `skill_gaps`, and `matched_skills` with Clerk-based RLS. The dashboard reads `job_analyses` metadata and supports prototype cloud save (structured results only).

## Related docs

Architecture and deployment planning for the hosted version live in the repo root under `docs/` (outside this folder). This README covers only the Next.js frontend.

**Before demos:** run [`docs/HOSTED_PROTOTYPE_SMOKE_TEST.md`](../docs/HOSTED_PROTOTYPE_SMOKE_TEST.md).
