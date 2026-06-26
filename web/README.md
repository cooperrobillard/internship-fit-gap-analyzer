# Job Fit & Skill-Gap Analyzer — Web Frontend

This folder contains the Next.js 16 frontend for the hosted **Job Fit & Skill-Gap Analyzer**. The repository remains named `internship-fit-gap-analyzer`. The web app runs on Vercel with Clerk authentication, a Next.js `/api/analyze` proxy, Render FastAPI analysis, and Supabase structured saved data protected by RLS.

The current web app is an active limited-public-beta surface. Dev 19 privacy/RLS/abuse evidence, Dev 20 app-shell and launch polish, Dev 21 route redesign/visual QA, and Version 22 curated cross-domain taxonomy validation are complete in the repository. Final production launch verification has not been declared complete.

## Current frontend surfaces

- Public landing page with rule-based/not-AI positioning, curated cross-domain taxonomy copy, current feature proof, and privacy/data-control links.
- Clerk sign-in and sign-up routes with product context.
- Protected `/dashboard` workspace.
- Dashboard `POST /api/analyze` proxy to Render FastAPI rule-based analysis.
- Transient pasted text and transient `.txt` input support.
- **Try sample inputs** and **Run analysis (does not save)** workflow labels, currently using a fictional Supply Chain Operations Analyst Intern sample for Northstar Distribution.
- Structured resume profiles with profile metadata and skill lists.
- Saved-profile analysis handoff that constructs temporary analysis input from selected profile metadata and skills.
- **Save structured results** for matched/missing skills, categories, counts, timestamps, job metadata, and notes.
- Saved-analysis history, detail view, search/filter, comparison, recurring-gap statistics, export/download controls where supported, individual deletion, and selected deletion for checked currently loaded analyses after confirmation.
- Privacy page explaining transient inputs, structured saves, structured profiles, current controls, providers, and limitations.
- Safe loading, validation, error, retry, `413 Payload Too Large`, and `429` cooldown handling.

## Hosted architecture

```text
Browser / Next.js dashboard
  → Next.js /api/analyze on Vercel
  → Render FastAPI /analyze
  → structured rule-based analysis result
  → optional Supabase save of structured records
```

Clerk protects the dashboard route and supplies the signed-in user context for Supabase browser access. Browser code uses only Supabase publishable/browser-safe configuration. Server-only analysis configuration remains in Vercel/Render environment variables.

## Privacy posture

- Analysis is rule-based with explicit taxonomy phrases and reviewed aliases, not AI or semantic judgment.
- Pasted or uploaded resume/job text is processed for the request.
- The application save path does not intentionally persist raw resume body text or raw job-description body text.
- Saved analyses store structured results and metadata.
- Structured profiles store profile metadata and skill names, not raw resume body text.
- Platform or service logging cannot be guaranteed absent; avoid unusually sensitive content.
- Dev 19 recorded two-user RLS verification and abuse/rate-limit evidence, but this is not a formal security audit, penetration test, or legal privacy-policy review.

Supporting records:

- [`../docs/VERSION_22_CHECKPOINT.md`](../docs/VERSION_22_CHECKPOINT.md)
- [`../docs/TAXONOMY_MAINTENANCE.md`](../docs/TAXONOMY_MAINTENANCE.md)

- [`../docs/DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md`](../docs/DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md)
- [`../docs/DEV19_RLS_AUTH_REVERIFICATION.md`](../docs/DEV19_RLS_AUTH_REVERIFICATION.md)
- [`../docs/DEV19_ABUSE_RATE_LIMIT_REVIEW.md`](../docs/DEV19_ABUSE_RATE_LIMIT_REVIEW.md)
- [`../docs/DEV20_LIMITED_PUBLIC_BETA_LAUNCH_READINESS.md`](../docs/DEV20_LIMITED_PUBLIC_BETA_LAUNCH_READINESS.md)

## Run locally

From this `web/` directory:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill `web/.env.local` with local Clerk, Supabase, and analysis API values. Never commit `web/.env.local` or any secret-bearing file.

For the full local stack, run the FastAPI service from the repository root in another terminal:

```bash
python3 -m uvicorn api.main:app --reload --port 8000
```

or use the repository helper:

```bash
chmod +x scripts/run_local_full_stack_demo.sh
./scripts/run_local_full_stack_demo.sh
```

The local dashboard is available at `http://localhost:3000/dashboard`; the browser calls `/api/analyze`, and Next.js forwards to the configured FastAPI service.

## Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing page |
| `/privacy` | Public | Privacy and data controls |
| `/sign-in` | Public | Clerk sign-in with product context |
| `/sign-up` | Public | Clerk sign-up with product context |
| `/dashboard` | Protected | Analysis, saved analyses, recurring gaps, comparison, exports, profiles |

Route protection is handled by the existing Next.js proxy/middleware boundary. This document does not change auth behavior.

## Environment variables

Local values go in `web/.env.local`; hosted values are configured in provider dashboards by a human.

| Group | Examples | Notes |
|---|---|---|
| Clerk | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Public key is browser-visible; secret key is server-only. |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Use the publishable/browser-safe key only in client code. |
| Analysis API | `ANALYSIS_API_URL`, `ANALYSIS_API_SHARED_SECRET` | Server-side Vercel/Render configuration. |

Do not put server secrets in `NEXT_PUBLIC_*` variables. Do not use Supabase service-role credentials in browser/client code.

## Checks

From the repository root for a release candidate:

```bash
python3 tests/test_api_service.py
python3 run_tests.py
python3 -m py_compile api/main.py api/models.py tests/test_api_service.py run_tests.py streamlit_app.py
cd web && npm run lint && npm run build && cd ..
git diff --check
```

Before preview or production review, also run the tracked-file privacy checks documented in [`../docs/HOSTED_PROTOTYPE_SMOKE_TEST.md`](../docs/HOSTED_PROTOTYPE_SMOKE_TEST.md).

## Current limits

- Limited public beta/portfolio software, not mature production SaaS.
- No AI/semantic matching, PDF/DOCX parsing, application tracking, billing, or organization features.
- No account-wide export, account-wide delete-all, automated retention, restore/undo, or automatic Clerk-account-to-Supabase cleanup guarantee; selected deletion is limited to checked records in the current loaded result set.
- Final production verdict remains pending human Vercel preview review, merge, production smoke test, screenshot evidence, and deployed-environment verification.
