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
| `ALLOWED_ORIGINS` | Comma-separated browser origins for CORS (e.g. `https://your-app.vercel.app`). When unset or blank, defaults to `http://localhost:3000` and `http://127.0.0.1:3000` for local Next.js dev. |
| `PORT` | Set by the host platform; passed to uvicorn `--port` |

Do not commit `.env` files. Do not set `ALLOWED_ORIGINS` to `*` unless you have a deliberate reason and understand the risk.

## Privacy

The API analyzes pasted resume and job description text **in memory only**. It does not write raw resume or job text to disk, SQLite, Supabase, or external APIs.

## Security

This is still a **prototype**. There is no production API authentication yet. Do not expose the service to untrusted public traffic without rate limiting and an auth strategy.
