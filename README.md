# Internship Fit & Skill-Gap Analyzer

A **rule-based** internship fit and skill-gap analyzer. It compares resume text and job descriptions against a JSON **skill taxonomy** and **aliases**, reports **matched skills** and **missing skills**, and summarizes **recurring gaps** across multiple postings.

This is a **portfolio and learning project**—not production SaaS, not semantic/AI matching, and not a guarantee of job fit.

## Current status

| Surface | Status |
|---------|--------|
| **Local Python app** | Stable — CLI, Streamlit UI, SQLite persistence, pandas summaries |
| **Hosted prototype** | Demoable — Next.js on Vercel, FastAPI on Render, Clerk auth, Supabase with RLS |

The **local app** remains the full-featured offline workflow (uploads, SQLite history, comparison, exports). The **hosted prototype** is a separate dashboard path for sign-in, cloud save/read, and browser analysis—it is still prototype-stage, not production-hardened.

## Architecture (hosted prototype)

```text
Browser
  → Vercel (Next.js, web/)
      → Clerk (sign-in, protected /dashboard)
      → POST /api/analyze (Next.js route handler)
          → Render (FastAPI, api/)
              → rule-based analyzer (src/, in-memory)
      → Supabase (saved analyses, RLS per Clerk user)
```

- Browser analysis goes through **`/api/analyze`** on Vercel—not directly to Render.
- Render **`POST /analyze`** accepts a server-only **`X-Analysis-Api-Key`** when `ANALYSIS_API_SHARED_SECRET` is set.
- Cloud saves store **structured skills and metadata only**—not raw resume or job body text.

Details: [`web/README.md`](web/README.md), [`docs/VERSION_13_HOSTED_DEPLOYMENT_CHECKPOINT.md`](docs/VERSION_13_HOSTED_DEPLOYMENT_CHECKPOINT.md).

## What works now

**Local**

- CLI analysis (folder or single job file), markdown/CSV outputs
- Streamlit UI (sample, paste, upload on localhost)
- SQLite saved-analysis history (search, compare, delete)
- pandas recurring-gap summary CSVs
- Automated test suite via `run_tests.py`

**Hosted prototype**

- Next.js landing page and Clerk sign-in/sign-up
- Protected dashboard with analysis form
- Hosted analysis via `/api/analyze` → Render FastAPI
- Supabase save/read of prototype analyses with per-user RLS
- Hosted smoke-test checklist ([`docs/HOSTED_PROTOTYPE_SMOKE_TEST.md`](docs/HOSTED_PROTOTYPE_SMOKE_TEST.md))

**Not built yet (or limited)**

- Semantic or AI matching
- PDF/DOCX parsing in the web app
- Full application tracking, billing, or production security review
- Detailed skill-row drill-down in the hosted saved list UI

## Prototype limitations

Be honest about what this is today:

- **Rule-based matching only** — keywords and aliases, not meaning or evidence strength
- **No semantic/AI matching**
- **Hosted prototype is not production-secure** — shared-secret API validation between Vercel and Render, not full production auth; no formal security audit
- **Do not paste sensitive resume or job text** into the hosted dashboard—use generic sample text for demos
- **Local Streamlit** does not replace the hosted stack; both coexist for different workflows

More detail: [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md), [`docs/DEPLOYMENT_READINESS.md`](docs/DEPLOYMENT_READINESS.md).

## Run locally

All commands from the **project root** unless noted. Python 3 required.

### Setup

```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
python3 -m pip install -r requirements.txt
```

### Tests

```bash
python3 run_tests.py
python3 tests/test_api_service.py
```

Expected: `All tests passed.` from `run_tests.py`.

### CLI (sample data)

```bash
python3 src/main.py
python3 src/main.py --job-file data/sample_jobs/sample_ai_engineering_internship.txt
python3 src/main.py --database data/outputs/analysis_results.db
python3 src/main.py --pandas-summary
```

### Streamlit (localhost only)

```bash
python3 -m streamlit run streamlit_app.py
```

Use **Try sample analysis** for safe public demo data. Private paths: `data/resume/resume.txt`, `data/jobs/` (Git-ignored).

### FastAPI (local analysis API)

```bash
python3 -m uvicorn api.main:app --reload --port 8000
```

`GET /health` → `{"status":"ok"}`. Optional shared-secret header when `ANALYSIS_API_SHARED_SECRET` is set locally.

### Next.js web app

```bash
cd web
cp .env.example .env.local    # fill in Clerk + Supabase + ANALYSIS_API_URL
npm install
npm run dev
```

Dashboard: http://localhost:3000/dashboard. The browser calls **`/api/analyze`**; the route handler forwards to local FastAPI. See [`web/README.md`](web/README.md).

### Full-stack local demo (one script)

```bash
chmod +x scripts/run_local_full_stack_demo.sh
./scripts/run_local_full_stack_demo.sh
```

Starts FastAPI at http://127.0.0.1:8000 and Next.js at http://localhost:3000. Requires `web/.env.local` for Clerk/Supabase features.

## Testing

| Check | Command / doc |
|-------|----------------|
| Full Python suite | `python3 run_tests.py` |
| FastAPI service | `python3 tests/test_api_service.py` |
| Web lint + build | `cd web && npm run lint && npm run build` |
| **Hosted prototype smoke test** | [`docs/HOSTED_PROTOTYPE_SMOKE_TEST.md`](docs/HOSTED_PROTOTYPE_SMOKE_TEST.md) |
| Testing guide | [`docs/TESTING.md`](docs/TESTING.md) |

Run the hosted smoke test before demos or after Vercel/Render deploys.

## Environment variables (web)

For local web development, copy [`web/.env.example`](web/.env.example) to **`web/.env.local`** (never commit it).

High-level groups:

| Group | Examples | Notes |
|-------|----------|--------|
| **Clerk** | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Auth shell |
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser client; use publishable key only |
| **Analysis API** | `ANALYSIS_API_URL`, `ANALYSIS_API_SHARED_SECRET` | Server-only on Vercel; same secret on Render |

Do **not** commit `.env`, `.env.local`, or `web/.env.local`. Do **not** put secrets in `NEXT_PUBLIC_*` variables. Full tables: [`web/README.md`](web/README.md).

## Privacy and security

**Repository**

- Do not commit private resume/job files, generated `data/outputs/`, SQLite `.db` files, or environment files.
- Use bundled samples under `data/sample_jobs/` and `data/resume/sample_resume.txt` for demos.

**Local app**

- Pasted/uploaded text in Streamlit is handled in memory for that session.
- SQLite stores analysis results, skill lists, counts, and optional metadata—not raw resume or full job posting body text.

**Hosted prototype**

- Analysis runs **in memory** on Render; raw pasted text is **not intentionally stored** in Supabase.
- Cloud save writes **matched/missing skills and metadata** (title, company, counts, etc.) per the current write contract.
- **Not ready for sensitive personal data**—treat the public deployment as a demo prototype until a full privacy and security review is complete.

## Safe demo workflow

| Path | Role |
|------|------|
| `data/resume/sample_resume.txt` | Public sample resume |
| `data/sample_jobs/` | Public sample job descriptions |

**Hosted dashboard:** use short generic skill phrases only—not real resumes or job postings.

## Project structure

```text
internship-fit-gap-analyzer/
  api/                 FastAPI analysis service (local + Render)
  web/                 Next.js frontend (local + Vercel)
  data/                taxonomy, aliases, samples (private paths Git-ignored)
  docs/                architecture, deployment, smoke test, testing
  scripts/             local full-stack demo, DB inspect
  src/                 rule-based analyzer (CLI + API)
  tests/               Python test files
  streamlit_app.py     local Streamlit UI
  run_tests.py         full Python test gate
```

## CLI quick reference

```bash
python3 src/main.py --help
python3 scripts/inspect_database.py data/outputs/analysis_results.db
```

Do not pass `--jobs` and `--job-file` together. Outputs: `data/outputs/gap_report.md`, `gap_summary.csv`, `recurring_gaps.csv`, optional `analysis_results.db`.

## Documentation

| Document | Purpose |
|----------|---------|
| [`docs/HOSTED_PROTOTYPE_SMOKE_TEST.md`](docs/HOSTED_PROTOTYPE_SMOKE_TEST.md) | Pre-demo / post-deploy checklist |
| [`web/README.md`](web/README.md) | Next.js app, env vars, local + hosted web |
| [`docs/TESTING.md`](docs/TESTING.md) | Canonical testing guide |
| [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md) | Limitations and privacy notes |
| [`docs/DEPLOYMENT_READINESS.md`](docs/DEPLOYMENT_READINESS.md) | Demo-ready vs. not production-ready |
| [`docs/PRODUCT_ROADMAP.md`](docs/PRODUCT_ROADMAP.md) | Milestones and future direction |
| [`docs/PUBLIC_PRODUCT_ROADMAP.md`](docs/PUBLIC_PRODUCT_ROADMAP.md) | Public app vision, parity audit, Version 15+ plan |
| [`docs/VERCEL_FRONTEND_DEPLOYMENT.md`](docs/VERCEL_FRONTEND_DEPLOYMENT.md) | Vercel setup |
| [`docs/RENDER_BACKEND_DEPLOYMENT.md`](docs/RENDER_BACKEND_DEPLOYMENT.md) | Render setup |

## Learning purpose

This project supports learning Python, CLI design, testing, SQLite, optional pandas, Git workflow, and a first hosted full-stack prototype (Next.js, Clerk, Supabase, FastAPI)—while building something useful for internship search planning.
