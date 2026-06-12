# Render Backend Deployment

Deploy the **FastAPI analysis service prototype** (`api.main:app`) to [Render](https://render.com/) as a Python web service. This document is a manual setup guide—not an automated deploy config.

Related: [`VERSION_13_DEPLOYMENT_PATH.md`](VERSION_13_DEPLOYMENT_PATH.md), [`api/README.md`](../api/README.md).

---

## Purpose

Host the rule-based Python analyzer behind HTTP so the Vercel Next.js app (via `/api/analyze`) or `curl` can call `GET /health` and `POST /analyze` in a deployed environment. The Streamlit app and CLI remain local tools and are **not** deployed by this service.

---

## Render service settings

Create a **Web Service** in the Render dashboard:

| Setting | Value |
|---------|--------|
| **Service type** | Web Service |
| **Runtime** | Python 3 |
| **Repository** | `internship-fit-gap-analyzer` (your GitHub fork or upstream) |
| **Branch** | `main` (or your deploy branch) |
| **Root directory** | Leave blank (repository root) |
| **Build command** | `pip install -r requirements.txt` |
| **Start command** | `uvicorn api.main:app --host 0.0.0.0 --port $PORT` |
| **Health check path** | `/health` |

Render sets `$PORT` automatically. The app import path must stay **`api.main:app`** so Python resolves the `api` package from the repo root.

---

## Environment variables

Set these in Render → your service → **Environment**:

| Variable | Purpose |
|----------|---------|
| `ALLOWED_ORIGINS` | Comma-separated browser origins for CORS (no spaces required; trimming is supported) |
| `ANALYSIS_API_SHARED_SECRET` | Shared secret for `/analyze` request validation (same value as Vercel; optional locally) |

**Examples for `ALLOWED_ORIGINS` (placeholders only — use your real URLs):**

Local / smoke testing on Render before Vercel is wired:

```text
http://localhost:3000,http://127.0.0.1:3000
```

After Vercel is deployed:

```text
https://your-vercel-app.vercel.app,https://your-custom-domain.com
```

Optional preview URL (if you use branch previews):

```text
https://your-vercel-app.vercel.app,https://your-git-branch-your-project.vercel.app
```

| Variable | Purpose |
|----------|---------|
| `PYTHON_VERSION` | Optional — e.g. `3.13.5` if Render needs an explicit version pin |

When `ANALYSIS_API_SHARED_SECRET` is set, `POST /analyze` requires header `X-Analysis-Api-Key` with the same value. `GET /health` stays public. The Vercel `/api/analyze` route handler sends this header server-side.

Do **not** commit `.env` files or paste secrets into the repository. Do not set `ALLOWED_ORIGINS` to `*` for normal production use.

---

## Verification after deployment

Replace `YOUR_RENDER_SERVICE_URL` with the URL Render assigns (e.g. `https://your-service.onrender.com`).

**Health check:**

```bash
curl https://YOUR_RENDER_SERVICE_URL/health
```

Expected: `{"status":"ok"}`

**Analyze (use generic sample text only — not real private resumes):**

When `ANALYSIS_API_SHARED_SECRET` is set:

```bash
curl -s -X POST https://YOUR_RENDER_SERVICE_URL/analyze \
  -H "Content-Type: application/json" \
  -H "X-Analysis-Api-Key: YOUR_SHARED_SECRET" \
  -d '{"resumeText":"Python and SQL experience","jobText":"Intern role requiring Python, SQL, and pandas."}'
```

When the secret is unset (local dev only):

```bash
curl -s -X POST https://YOUR_RENDER_SERVICE_URL/analyze \
  -H "Content-Type: application/json" \
  -d '{"resumeText":"Python and SQL experience","jobText":"Intern role requiring Python, SQL, and pandas."}'
```

Expected: JSON with `matchedSkills`, `missingSkills`, counts, and `summary`. Raw input text must **not** appear in the response.

Then set **`ANALYSIS_API_URL`** on Vercel to `https://YOUR_RENDER_SERVICE_URL` (no trailing slash), set the same **`ANALYSIS_API_SHARED_SECRET`** on Vercel and Render, and confirm the dashboard analysis form works from the deployed frontend via `/api/analyze`.

---

## Privacy

- The API analyzes submitted resume and job description text **in memory only**.
- It does **not** write raw resume or job text to disk, SQLite, Supabase, or external APIs.
- Do **not** paste real private resume or job text into public docs, Git commits, screenshots, or issue comments. Use the generic sample strings above for smoke tests.

---

## Security

- This is a **prototype backend deployment**.
- **CORS is not API authentication** — it only controls which browser origins may call the API.
- **`ANALYSIS_API_SHARED_SECRET`** is a first request-validation layer between Vercel and Render—not full production auth.
- Add rate limiting and abuse controls before serious public use.

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Render cannot find the app | Start command must be `uvicorn api.main:app --host 0.0.0.0 --port $PORT`; root directory must be repo root (not `api/`) |
| “No open ports” / service won’t bind | Start command must include `--host 0.0.0.0` and `--port $PORT` |
| Browser calls from Vercel fail (CORS) | `ALLOWED_ORIGINS` on Render must include the exact Vercel origin (scheme + host, no path) |
| `/analyze` returns 401 | `X-Analysis-Api-Key` must match `ANALYSIS_API_SHARED_SECRET`; Vercel route handler must send the header |
| `502` / health check fails | Confirm `requirements.txt` installs `fastapi` and `uvicorn`; check Render logs for import errors |
| Analysis returns errors | Confirm `data/skills_taxonomy.json` and `data/skill_aliases.json` exist in the deployed repo tree |

---

## Next steps

After the API is live: deploy the Next.js app on Vercel, configure Clerk and Supabase, and run the full hosted flow checklist in [`VERSION_13_DEPLOYMENT_PATH.md`](VERSION_13_DEPLOYMENT_PATH.md).
