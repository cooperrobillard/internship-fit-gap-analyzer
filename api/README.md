# FastAPI analysis service

HTTP wrapper around the rule-based Python analyzer in `src/` and the optional server-side OpenAI Smart AI service. Used by the Next.js dashboard locally and on Render.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness check — returns `{"status":"ok"}` |
| `POST` | `/analyze` | Analyze pasted resume + job text (JSON body) |
| `POST` | `/ai/analyze` | Smart AI job-fit analysis using transient résumé/job text |
| `POST` | `/ai/extract-profile` | Smart AI structured profile extraction using transient résumé text |
| `POST` | `/extract-document` | Deterministic transient document text extraction |

### `POST /analyze` request body

- `resumeText` (required)
- `jobText` (required)
- `jobTitle`, `company`, `sourceUrl`, `notes` (optional)

Response: matched/missing skills, counts, summary, and optional metadata echo. Raw `resumeText` and `jobText` are **not** returned.

## Commands

**Local development (repository root):**

```bash
python3 -m uvicorn api.main:app --reload --port 8000
```

**Hosting start command (Render, Railway, etc.):**

```bash
uvicorn api.main:app --host 0.0.0.0 --port $PORT
```

Import path for both: `api.main:app`

Health check URL: `http://127.0.0.1:8000/health` (local) or `https://<your-host>/health` (hosted).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `ALLOWED_ORIGINS` | Comma-separated browser origins for CORS (see below) |
| `ANALYSIS_API_SHARED_SECRET` | Optional shared secret for analysis and extraction request validation (see below) |
| `AI_FEATURES_ENABLED` | Global Smart AI kill switch; must be exactly `true` to enable AI endpoints |
| `OPENAI_API_KEY` | Server-only OpenAI project API key required for Smart AI |
| `OPENAI_ANALYSIS_MODEL` | Optional Smart AI model override; defaults in `ai_analysis_service.py` |
| `OPENAI_REQUEST_TIMEOUT_SECONDS` | Optional provider-request timeout override |
| `PORT` | Set by the host platform; passed to uvicorn `--port` |

Do not commit `.env` files or secrets to the repository.

## CORS configuration

The API uses `ALLOWED_ORIGINS` (comma-separated). Values are trimmed; empty entries are ignored. The list is read at process start.

**Local default** (when `ALLOWED_ORIGINS` is unset or blank):

- `http://localhost:3000`
- `http://127.0.0.1:3000`

No production domains are baked into code. The default never includes `*`.

**Production** (set on Render/Railway when the Vercel URL is known):

```bash
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-custom-domain.com
```

**Vercel preview deployments** (optional — add preview URLs you use):

```bash
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-git-branch-your-project.vercel.app
```

Do **not** use `ALLOWED_ORIGINS=*` for normal production deployment. When you add a custom domain or new preview URL, update the backend host environment variables — do not commit env files.

After deploy, confirm the browser receives `Access-Control-Allow-Origin` for your Vercel origin on `OPTIONS`/`POST /analyze`.

## Privacy

Rule-based analysis processes pasted résumé and job-description text in memory without OpenAI. When Smart AI is selected and enabled, the service sends the transient request text to OpenAI with `store=False`; the application does not intentionally persist raw résumé/job text to disk, SQLite, or Supabase. Provider/platform logging cannot be guaranteed absent, so avoid unusually sensitive content.

Smart AI makes one OpenAI attempt (`max_retries=0`). Provider billing/quota, rate-limit, timeout, connection, authentication/configuration, server, or invalid-response failures return a safe error to the Next.js route, which uses the existing rule-based fallback. There is no application-level per-user Smart AI quota.

## Request validation (`/analyze`)

When `ANALYSIS_API_SHARED_SECRET` is set on the server, analysis and extraction POST endpoints require a matching request header:

```http
X-Analysis-Api-Key: <same value as ANALYSIS_API_SHARED_SECRET>
```

Missing or wrong values return `401`. When the env var is unset, local development works as before (no header required).

`GET /health` stays public and does not require the header.

The Next.js dashboard calls `/api/analyze`, which forwards to FastAPI with this header using server-only env vars. This is a **first protection layer** (shared secret between app and API), not full production authentication. Do not log the secret.

## Security

This is still a **prototype**. Shared-secret validation is not a substitute for user auth, rate limiting, or a full API security review. Do not expose the service to untrusted public traffic without additional controls.
