# Version 13 Hosted Deployment Checkpoint

Record of the **first successful hosted full-stack prototype** deployment (Vercel + Render + Supabase + Clerk). This is a learning checkpoint—not a production launch sign-off.

Related: [`VERSION_13_DEPLOYMENT_PATH.md`](VERSION_13_DEPLOYMENT_PATH.md), [`RENDER_BACKEND_DEPLOYMENT.md`](RENDER_BACKEND_DEPLOYMENT.md), [`VERCEL_FRONTEND_DEPLOYMENT.md`](VERCEL_FRONTEND_DEPLOYMENT.md).

---

## Current hosted prototype status

- **Next.js frontend** is deployed on **Vercel** (`web/`).
- **FastAPI backend** is deployed on **Render** (`api.main:app`).
- The frontend points to the Render backend via **`NEXT_PUBLIC_ANALYSIS_API_URL`**.
- The hosted frontend can call the hosted **`POST /analyze`** endpoint with safe sample text.
- Render **`GET /health`** returns `{"status":"ok"}`.
- **Clerk** environment variables are configured in Vercel.
- **Supabase** frontend environment variables are configured in Vercel.
- Render **`ALLOWED_ORIGINS`** includes the **actual Vercel browser origin** used in production/preview testing.
- The project remains a **hosted prototype**, not production-secure SaaS.

---

## Verified deployment architecture

```text
Browser
  └── Vercel (Next.js, web/)
        ├── Clerk (auth)
        ├── Supabase (cloud DB read/write for prototype save)
        └── HTTPS → Render (FastAPI, api/)
              └── Rule-based analyzer (src/, in-memory only)
```

| Component | Role |
|-----------|------|
| **Vercel** | Hosts `web/` — landing, sign-in, dashboard, analysis form |
| **Render** | Hosts `api.main:app` — `/health`, `/analyze` |
| **Supabase** | Postgres + RLS for saved analyses (metadata/skills, no raw body text) |
| **Clerk** | User authentication; JWT for Supabase client |
| **FastAPI** | Rule-based resume vs. job skill comparison in memory |

Local **Streamlit** and **CLI** remain separate tools on the developer machine.

---

## Important deployment lessons

### Vercel

- A live site can show **`404: NOT_FOUND`** if the **active production deployment** does not match current project settings (wrong root, old build, or unpromoted deploy).
- **Root Directory must be `web`** — building from the repo root will not produce the Next.js app.
- After changing root directory or env vars, **redeploy** or **promote** the correct deployment.
- **`.env.local` is hidden in Finder** on macOS — use terminal (`ls -la web/`, `cp web/.env.example web/.env.local`) to inspect or copy local env templates.
- **Deployment URLs differ** — preview URLs, branch URLs, and the “clean” production URL may not match; use the exact origin the browser uses when configuring CORS.

### Supabase env naming

- The deployed app uses **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** (with code fallback for `NEXT_PUBLIC_SUPABASE_ANON_KEY` in newer branches).
- Some planning docs say `ANON_KEY` — they mean the same Supabase **anon/publishable** key. Align Vercel variable names with what `web/src/lib/supabase/client.ts` reads.

### Render CORS

- **`ALLOWED_ORIGINS` must include the exact browser origin** shown in DevTools → Network (scheme + host, **no path**).
- **No trailing slash** on origins (e.g. `https://app.vercel.app` not `https://app.vercel.app/`).
- **CORS is not authentication** — it only allows browser cross-origin calls.
- Debug with **browser DevTools** (failed `OPTIONS`/`POST`) and:
  ```bash
  curl -i -X OPTIONS "https://YOUR_RENDER_HOST/analyze" \
    -H "Origin: https://YOUR_VERCEL_HOST" \
    -H "Access-Control-Request-Method: POST"
  ```

### Process

- Feature work landed via **git branches merged back to `main`** before/after deploy docs.
- **Learning log** was updated separately to capture the deployment narrative (not duplicated here).

---

## What is working

- Vercel frontend loads (landing and auth routes).
- Render backend responds on `/health`.
- Hosted **analyze** flow works with **safe sample text** (matched/missing lists are disjoint after skill-consistency fix).
- CORS allows the **actual Vercel origin** used in testing.
- **Disallowed origins** are rejected (no wildcard default on the API).
- Clerk sign-in shell and Supabase env wiring are in place on Vercel.
- Prototype **cloud save / saved list** path works when Supabase schema + RLS + Clerk integration are configured.
- Deployment documentation exists for Render and Vercel.
- Version 13 deployment branches were merged to **`main`**.

---

## What remains prototype-only

- No **production API authentication** on Render.
- **CORS ≠ auth** — public `/analyze` is still abusable without rate limits.
- No **production security** claim or formal review.
- No **PDF/DOCX** parsing.
- No **semantic/AI** matching.
- No decision to store **raw resume/job text** in the cloud.
- No **CI/CD** pipeline for deploy + smoke tests.
- No **production privacy/security review**.
- No **custom domain** decision yet.
- No **application-status tracking** product feature yet.

---

## Production-readiness cleanup list

### Priority 1 — before sharing broadly

- [ ] Add **API authentication or request validation** between Vercel and Render (shared secret, JWT, or similar).
- [ ] Confirm **Clerk + Supabase RLS** with real signed-in users (cross-user isolation).
- [ ] Add a clear **prototype / privacy notice** in the hosted UI.
- [ ] **Reconcile env docs** — standardize on `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `ANON_KEY`) across README, Vercel, and code.
- [ ] Audit repo for **committed secrets** and **private resume/job text** in issues or docs.

### Priority 2 — before portfolio / public demo polish

- [ ] Add a **hosted demo verification checklist** (scripted smoke test).
- [ ] Improve **error messages** for API unreachable, CORS, and save failures.
- [ ] Document **monitoring/logging** expectations for Render + Vercel.
- [ ] Add a short **root README** section linking the live hosted prototype.
- [ ] Consider **custom domain** or subpath later.

### Priority 3 — future product work

- [ ] PDF/DOCX parsing.
- [ ] Skill taxonomy / admin workflow.
- [ ] Semantic or AI-assisted matching.
- [ ] Application tracking.
- [ ] Resume tailoring.
- [ ] Better user onboarding.

---

## Recommended next implementation step

**Version 13 Step 8** — Add a **hosted prototype notice** and **deployment status** section to the web app (dashboard or landing) and/or root `README.md`, so visitors see honest limits (prototype, no raw text storage, API not production-hardened).

---

## Quick post-deploy smoke (safe text only)

1. Open Vercel URL → sign in.
2. Dashboard → paste generic sample resume/job text → **Analyze**.
3. Confirm matched/missing skills; no skill appears in both lists.
4. Optional: **Save this prototype analysis** → row appears in saved list.
5. `curl https://YOUR_RENDER_HOST/health` → `{"status":"ok"}`.

Do not use real private resumes in public smoke tests or documentation.
