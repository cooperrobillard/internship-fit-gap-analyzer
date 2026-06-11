# Version 13 Deployment Path

Implementation checklist for moving the **local full-stack prototype** to a **first hosted prototype**. This is a practical deployment path—not a full architecture spec.

Related: [`DEPLOYMENT_READINESS.md`](DEPLOYMENT_READINESS.md), [`RENDER_BACKEND_DEPLOYMENT.md`](RENDER_BACKEND_DEPLOYMENT.md), [`VERCEL_FRONTEND_DEPLOYMENT.md`](VERCEL_FRONTEND_DEPLOYMENT.md), [`VERSION_13_HOSTED_DEPLOYMENT_CHECKPOINT.md`](VERSION_13_HOSTED_DEPLOYMENT_CHECKPOINT.md), root [`README.md`](../README.md), [`web/README.md`](../web/README.md).

---

## Hosted prototype status (checkpoint)

**Version 13 Steps 5–6 (deploy docs) are complete.** The first full-stack hosted prototype (Vercel + Render + Clerk + Supabase) was deployed and verified. Detailed lessons, working scope, and cleanup priorities are in [`VERSION_13_HOSTED_DEPLOYMENT_CHECKPOINT.md`](VERSION_13_HOSTED_DEPLOYMENT_CHECKPOINT.md).

**Next:** Version 13 Step 8 — hosted prototype notice in the web app or README.

---

## Current goal

- ~~Move from local-only toward a **first hosted full-stack prototype**.~~ **Done** — see checkpoint doc; continue hardening and honest UX.
- Keep the **stable local Python/Streamlit app** intact at the repository root—it is not replaced by the hosted web path.

---

## Chosen architecture

| Layer | Platform | Repo location |
|-------|----------|---------------|
| Frontend | **Vercel** | `web/` (Next.js) |
| Analysis API | **Render** or **Railway** | `api/` (FastAPI) |
| Cloud database | **Supabase** (Postgres) | `web/database/schema.sql` |
| Authentication | **Clerk** | `web/` auth shell |

Local analysis logic remains in `src/`; FastAPI wraps it. Streamlit and CLI continue as offline/local tools.

---

## What is being deployed

- **Next.js web app** — landing, Clerk sign-in, dashboard, analysis form, prototype cloud save/read
- **FastAPI analysis service** — `GET /health`, `POST /analyze` (rule-based Python analyzer)
- **Supabase schema** — `analysis_runs`, `job_analyses`, `matched_skills`, `skill_gaps`, RLS policies
- **Clerk configuration** — production instance URLs, redirects, Supabase third-party auth integration

---

## What is not being deployed yet

- Raw **resume** or **job description text** storage
- Semantic / **AI matching**
- **PDF/DOCX** parsing or upload pipelines
- **Billing** or organizations
- **Production-grade API authentication** on FastAPI
- **Full CI/CD** (build, deploy, smoke tests in pipeline)

---

## Required environment variables

Set these in each host’s dashboard—**never commit** `.env`, `.env.local`, or `web/.env.local`.

### Web (Vercel)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk browser SDK |
| `CLERK_SECRET_KEY` | Clerk server/middleware (Vercel server only) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase browser client (anon/publishable key) |
| `NEXT_PUBLIC_ANALYSIS_API_URL` | Hosted FastAPI base URL (e.g. `https://your-api.onrender.com`) |

**Note:** The web app code currently reads `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`—that is the same Supabase anon/publishable key. Align the Vercel variable name with the code in the hosting-prep branch, or set both names to the same value during migration.

### Backend (Render or Railway)

| Variable | Purpose |
|----------|---------|
| `ALLOWED_ORIGINS` | Comma-separated production CORS origins (e.g. `https://your-app.vercel.app`) |

Additional backend env vars may be added in `feature/fastapi-hosting-prep` (start command, port binding, optional `PORT`).

### Secrets discipline

- Do **not** commit env files.
- Do **not** put `CLERK_SECRET_KEY` or Supabase **service role** key in browser-exposed `NEXT_PUBLIC_*` variables.
- Do **not** use the Supabase service role key in the Next.js client.

---

## Deployment order

Check off in this order to reduce broken intermediate states:

1. **Verify local gates**
   - `python3 run_tests.py`
   - `python3 tests/test_api_service.py`
   - `cd web && npm run lint && npm run build`
   - `./scripts/run_local_full_stack_demo.sh` (manual smoke test)

2. **Prepare FastAPI for hosting** (`feature/fastapi-hosting-prep`)
   - Production start command (e.g. `uvicorn api.main:app --host 0.0.0.0 --port $PORT`)
   - Confirm `requirements.txt` includes `fastapi`, `uvicorn`, and runtime deps for `src/`
   - Ensure `data/skills_taxonomy.json` and `data/skill_aliases.json` are available to the deployed API

3. **Configure production CORS**
   - Set `ALLOWED_ORIGINS` on Render/Railway to include the deployed Vercel frontend URL(s)
   - Local defaults are localhost only; do not use `*` in production
   - Do not commit env files or secrets

4. **Deploy FastAPI backend**
   - Render Web Service — see [`RENDER_BACKEND_DEPLOYMENT.md`](RENDER_BACKEND_DEPLOYMENT.md) (Railway is an alternative with similar settings)
   - Confirm `GET /health` returns `{"status":"ok"}` on the public URL

5. **Configure Supabase**
   - Run `web/database/schema.sql` on the hosted project
   - Enable Clerk as Supabase third-party JWT provider
   - Verify RLS: users can only read/write their own `clerk_user_id` rows

6. **Configure Clerk (production)**
   - Production instance keys for Vercel
   - Sign-in/sign-up URLs and redirect URLs pointing to the Vercel domain
   - Allowed origins / callback URLs for hosted app

7. **Configure Vercel env vars**
   - All web variables from the table above
   - `NEXT_PUBLIC_ANALYSIS_API_URL` → deployed FastAPI URL

8. **Deploy Next.js frontend**
   - Vercel project rooted at `web/` — see [`VERCEL_FRONTEND_DEPLOYMENT.md`](VERCEL_FRONTEND_DEPLOYMENT.md)
   - Build command: `npm run build` (default)
   - Set `NEXT_PUBLIC_ANALYSIS_API_URL` to the Render API URL; update Render `ALLOWED_ORIGINS` with the Vercel host

9. **Test full hosted flow**
   - Sign in (Clerk)
   - Supabase status / saved analyses list
   - Paste resume + job text → analyze via hosted API
   - Save prototype analysis → row appears in saved list
   - Confirm no raw resume/job text in Supabase tables

---

## Immediate blockers / required prep

| Blocker | Action |
|---------|--------|
| **Production start command** | Document Render/Railway start command; bind `0.0.0.0` and platform `PORT` |
| **Hosting dependency check** | Verify taxonomy/alias JSON paths work when cwd is repo root on the host |
| **CORS env strategy** | Set `ALLOWED_ORIGINS` on the API host to include each Vercel production/preview URL |
| **Hosted API URL wiring** | Set `NEXT_PUBLIC_ANALYSIS_API_URL` on Vercel to the public FastAPI URL |
| **Supabase RLS + JWT** | Confirm Clerk JWT `sub` matches `clerk_user_id` on inserts; test cross-user isolation |
| **Env name alignment** | Reconcile `NEXT_PUBLIC_SUPABASE_ANON_KEY` vs `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in code |

---

## Recommended next implementation step

**Version 13 Step 8** — Add a hosted prototype notice and deployment status copy to the web UI or root README (see checkpoint doc).

---

## Safety notes

- **Do not commit** `.env`, `.env.local`, or `web/.env.local`.
- **Do not expose** `CLERK_SECRET_KEY` or Supabase **service role** key to the browser or public repos.
- **Do not claim production security yet**—this is a first hosted prototype, not a hardened production launch.
- FastAPI **does not store raw resume or job text** today, but the public API still needs rate limiting, auth strategy, and abuse controls before serious public use.
- Prototype cloud save stores **structured skills and metadata only**—keep that contract in hosted mode unless policy explicitly changes.

---

## Quick reference URLs (after deploy)

| Service | Example |
|---------|---------|
| FastAPI health | `https://<api-host>/health` |
| Next.js app | `https://<vercel-app>.vercel.app` |
| Dashboard | `https://<vercel-app>.vercel.app/dashboard` |
| Supabase | Project dashboard → SQL editor, RLS policies |
| Clerk | Dashboard → domains, API keys, redirect URLs |
