# FastAPI analysis service

HTTP wrapper around the rule-based Python analyzer in `src/`. Used by the Next.js dashboard during local development and prepared for future hosting on Render or Railway.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness check — returns `{"status":"ok"}` |
| `POST` | `/analyze` | Analyze pasted resume + job text (JSON body) |

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

The API analyzes pasted resume and job description text **in memory only**. It does not write raw resume or job text to disk, SQLite, Supabase, or external APIs.

## Security

This is still a **prototype**. There is no production API authentication yet. Do not expose the service to untrusted public traffic without rate limiting and an auth strategy.
