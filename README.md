# Job Fit & Skill-Gap Analyzer

Repository name: `internship-fit-gap-analyzer`.

**Production limited public beta:** https://jobfit.cooperrobillard.com

A **rule-based** job-fit and skill-gap analyzer. It compares resume text and job descriptions against a curated cross-domain JSON **skill taxonomy** and reviewed **aliases**, reports **matched skills** and **missing skills**, and summarizes **recurring gaps** across multiple postings.

This is a **portfolio and learning project** and limited public-beta product—not mature production SaaS, not semantic/AI matching, and not a guarantee of job fit.

## Current status

| Surface | Status |
|---------|--------|
| **Local Python app** | Stable — CLI, Streamlit UI, SQLite persistence, pandas summaries |
| **Hosted web app** | Versions 22, 23, and 24 complete for bounded scopes — validated curated taxonomy, saved-analysis data controls, and privacy-safe production observability are active; still a limited public-beta/portfolio product, not mature production SaaS or security certified |

The **local app** remains the full-featured offline workflow (uploads, SQLite history, comparison, exports). The **hosted web app** is the primary public product surface for sign-in, rule-based analysis, transient pasted/`.txt` inputs, structured resume-profile management, saved-profile analysis handoff, saved analysis review/search/filter/detail/comparison/export/delete, recurring gap stats, privacy/data-control copy, safe `413` handling, and safe `429` cooldown handling.

Dev 19 privacy/RLS/abuse hardening, Dev 20 application-shell and launch polish, Dev 21 route redesign/visual QA, Version 22 curated cross-domain taxonomy validation, Version 23 saved-analysis data controls, and Version 24 privacy-safe production observability are complete in the repository for their bounded scopes. Sentry receives only approved sanitized server-side failure events, UptimeRobot monitors the canonical frontend, retained old Vercel fallback, and backend health endpoint, and the production incident-response runbook exists. Version 25 Steps 1–6 are complete for their bounded scopes: the custom domain is active, the Clerk Production migration is complete, canonical metadata is implemented, Step 5 provider/integration reconciliation passed, and Step 6 canonical-host Production verification passed on commit `0ceb8b88a602f349e1de89e4fd9bf00e5725939d` with Version 23 17/17 and Version 25 7/7 automated results plus manual verification, cleanup, and rollback readiness. The current exact next step is Version 25 Step 7 — update portfolio and other approved public links to `https://jobfit.cooperrobillard.com`, complete the public sharing and launch checkpoint, and close Version 25 without overstating product maturity. These are scoped release checkpoints, not a final public-launch declaration, mature SaaS claim, security certification, penetration test, or legal compliance sign-off. See [`docs/DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md`](docs/DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md), [`docs/VERSION_23_CHECKPOINT.md`](docs/VERSION_23_CHECKPOINT.md), [`docs/VERSION_23_DATA_CONTROL_QA.md`](docs/VERSION_23_DATA_CONTROL_QA.md), [`docs/VERSION_24_CHECKPOINT.md`](docs/VERSION_24_CHECKPOINT.md), [`docs/PRODUCTION_INCIDENT_RESPONSE_RUNBOOK.md`](docs/PRODUCTION_INCIDENT_RESPONSE_RUNBOOK.md), [`docs/VERSION_24_RELEASE_DIRECTION.md`](docs/VERSION_24_RELEASE_DIRECTION.md), and [`docs/VERSION_25_STEP_6_PRODUCTION_VERIFICATION.md`](docs/VERSION_25_STEP_6_PRODUCTION_VERIFICATION.md).

## Architecture (hosted web app)

```text
Browser
  → Vercel (Next.js, web/)
      → Clerk (sign-in, protected /dashboard)
      → POST /api/analyze (Next.js route handler)
          → Render (FastAPI, api/)
              → rule-based analyzer (src/, in-memory)
      → Supabase (saved analyses + structured resume profiles, RLS per Clerk user)
```

- Browser analysis goes through **`/api/analyze`** on Vercel—not directly to Render.
- Dashboard analysis requires Clerk authentication at the application route.
- Render **`POST /analyze`** accepts a server-only shared secret when configured; browser code does not receive it.
- The proxy has safe request-size handling, including safe `413` responses for oversized requests.
- Vercel WAF rate limiting is active for `POST /api/analyze` with a fixed window of 20 requests per 60 seconds counted by IP.
- Cloud saves store **structured skills and metadata only**—not raw resume or job body text.

Details: [`web/README.md`](web/README.md), [`docs/VERSION_13_HOSTED_DEPLOYMENT_CHECKPOINT.md`](docs/VERSION_13_HOSTED_DEPLOYMENT_CHECKPOINT.md).

## What works now

**Local**

- CLI analysis (folder or single job file), markdown/CSV outputs
- Streamlit UI (sample, paste, upload on localhost)
- SQLite saved-analysis history (search, compare, delete)
- pandas recurring-gap summary CSVs
- Automated test suite via `run_tests.py`

**Hosted web app**

- Next.js landing page and Clerk sign-in/sign-up
- Protected dashboard with analysis form and **Try sample inputs** / **Run analysis (does not save)** workflow
- Hosted rule-based analysis via `/api/analyze` → Render FastAPI with transient pasted/`.txt` inputs
- Supabase **Save structured results** / read / individual delete of analyses with per-user RLS
- Structured resume-profile create/edit/delete and explicit saved-profile analysis handoff
- Recurring gap stats, saved-analysis detail, progressive saved-history loading in pages of ten, row multi-selection, **Select all visible**, selected CSV export, loaded CSV export, selected deletion with explicit confirmation and partial-failure handling, search/filter, compare, export/download, privacy/data-control page (`/privacy`), metadata labels
- Safe API validation/errors, safe loading states, safe `413` proxy request-size handling, safe `429` retry/cooldown handling, and active Vercel rate limiting
- CI-oriented privacy/backend/lint/build checks documented for change review
- Human two-user RLS verification passed on June 22, 2026
- Hosted smoke-test checklist ([`docs/HOSTED_PROTOTYPE_SMOKE_TEST.md`](docs/HOSTED_PROTOTYPE_SMOKE_TEST.md))

**Not built yet (or limited)**

- Semantic or AI matching
- PDF/DOCX parsing in the web app
- Full application tracking or billing
- Formal legal privacy policy, penetration test, or comprehensive security audit
- Account-wide select-all, one-click account-wide export, account-wide delete-all, restore/undo, automated retention, or account deletion data-cleanup integration
- Raw resume or job-body persistence in the cloud save path (intentionally omitted)


## Current taxonomy and validation facts

Technical documentation for Version 22 records a curated cross-domain taxonomy with 23 categories, 250 canonical skills, 98 alias groups, 21 fictional role cases, 19 negative controls, all categories exercised, 49 alias-driven expected detections, and 0 final validation failures. These are regression and integrity facts, not marketing claims of exhaustive occupational coverage. The hosted fictional supply-chain demo intentionally reflects current taxonomy behavior where `SAP ERP` detects both `erp` and `sap erp`. See [`docs/VERSION_22_CHECKPOINT.md`](docs/VERSION_22_CHECKPOINT.md) and [`docs/TAXONOMY_MAINTENANCE.md`](docs/TAXONOMY_MAINTENANCE.md).

## Current limitations

Be honest about what this is today:

- **Rule-based matching only** — curated keywords and aliases across multiple professional domains, not meaning or evidence strength
- **No semantic/AI matching** — the curated cross-domain taxonomy is broad but not exhaustive and does not infer unstated skills, proficiency, or evidence strength
- **Hosted web app is not mature production SaaS** — Clerk route protection, a server-only Render shared secret, RLS verification, rate limiting, Version 23 production data-control QA, and Version 24 bounded observability are in place, but there is no formal security audit, penetration test, or legal compliance certification
- **Do not paste unusually sensitive resume or job text** into the hosted dashboard—use generic sample text for demos when possible
- **No raw resume or job-body persistence** in the application save path
- **No account-wide controls** — saved-analysis selection, selected export, loaded export, deletion, search/filter, detail, and comparison operate only over records currently loaded in the browser
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
python3 tests/test_taxonomy_quality.py
python3 tests/test_taxonomy_role_validation.py
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
| Taxonomy quality | `python3 tests/test_taxonomy_quality.py` |
| Taxonomy role validation | `python3 tests/test_taxonomy_role_validation.py` |
| Web lint + build | `cd web && npm run lint && npm run build` |
| **Hosted web app smoke test** | [`docs/HOSTED_PROTOTYPE_SMOKE_TEST.md`](docs/HOSTED_PROTOTYPE_SMOKE_TEST.md) |
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

**Hosted web app**

- Analysis runs through Vercel and Render for each request; raw pasted/uploaded text is **not intentionally stored** in Supabase by the product save path.
- Cloud save writes **matched/missing skills and metadata** (title, company, source URL, notes, counts, categories, timestamps, etc.) per the current write contract.
- Structured resume profiles store names, optional notes/description, skill lists, source type, and timestamps—not raw resume body text.
- Platform/service logging cannot be guaranteed absent; avoid unusually sensitive content.
- Dev 19 verified two-user RLS isolation and active IP-based rate limiting, but this is not a formal legal/privacy or security-audit sign-off.

## Safe demo workflow

| Path | Role |
|------|------|
| `data/resume/sample_resume.txt` | Public sample resume |
| `data/sample_jobs/` | Public sample job descriptions |

**Hosted dashboard:** prefer short generic skill phrases or synthetic demo content; avoid unusually sensitive resumes or job postings.

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
| [`docs/DEPLOYMENT_READINESS.md`](docs/DEPLOYMENT_READINESS.md) | Historical pre-hosting checklist; see Dev 19 checkpoint for current readiness |
| [`docs/DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md`](docs/DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md) | Dev 19 privacy/data-control/readiness checkpoint |
| [`docs/DEV20_LIMITED_PUBLIC_BETA_LAUNCH_READINESS.md`](docs/DEV20_LIMITED_PUBLIC_BETA_LAUNCH_READINESS.md) | Dev 20 release-candidate readiness record |
| [`docs/VERSION_23_CHECKPOINT.md`](docs/VERSION_23_CHECKPOINT.md) | Version 23 saved-analysis data-control closure |
| [`docs/VERSION_23_DATA_CONTROL_QA.md`](docs/VERSION_23_DATA_CONTROL_QA.md) | Accepted production Playwright QA evidence for Version 23 data controls |
| [`docs/VERSION_24_RELEASE_DIRECTION.md`](docs/VERSION_24_RELEASE_DIRECTION.md) | Decision to do privacy-safe production observability before custom-domain launch |
| [`docs/TAXONOMY_MAINTENANCE.md`](docs/TAXONOMY_MAINTENANCE.md) | Maintenance rules for canonical skills, aliases, fixtures, integrity checks, and review boundaries |
| [`docs/VERSION_22_CHECKPOINT.md`](docs/VERSION_22_CHECKPOINT.md) | Version 22 cross-domain taxonomy expansion, validation evidence, copy reconciliation, and preserved limitations |
| [`docs/PRODUCT_ROADMAP.md`](docs/PRODUCT_ROADMAP.md) | Milestones and future direction |
| [`docs/PUBLIC_PRODUCT_ROADMAP.md`](docs/PUBLIC_PRODUCT_ROADMAP.md) | Public app vision, parity audit, Version 17+ plan |
| [`docs/VERSION_16_CHECKPOINT.md`](docs/VERSION_16_CHECKPOINT.md) | Version 16 comparison, export, privacy, readiness review (complete) |
| [`docs/VERSION_15_CHECKPOINT.md`](docs/VERSION_15_CHECKPOINT.md) | Version 15 hosted saved-analysis parity (complete) |
| [`docs/VERCEL_FRONTEND_DEPLOYMENT.md`](docs/VERCEL_FRONTEND_DEPLOYMENT.md) | Vercel setup |
| [`docs/RENDER_BACKEND_DEPLOYMENT.md`](docs/RENDER_BACKEND_DEPLOYMENT.md) | Render setup |

## Learning purpose

This project supports learning Python, CLI design, testing, SQLite, optional pandas, Git workflow, and a first hosted full-stack prototype (Next.js, Clerk, Supabase, FastAPI)—while building something useful for internship search planning.
