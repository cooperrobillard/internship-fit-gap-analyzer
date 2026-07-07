# Job Fit & Skill-Gap Analyzer — Web Frontend

This folder contains the Next.js 16 frontend for the hosted **Job Fit & Skill-Gap Analyzer**. The repository remains named `internship-fit-gap-analyzer`. The web app runs on Vercel with Clerk authentication, a Next.js `/api/analyze` proxy, Render FastAPI analysis, and Supabase structured saved data protected by RLS.

Canonical Production URL: https://jobfit.cooperrobillard.com

The current web app is an active limited-public-beta surface. Dev 19 privacy/RLS/abuse evidence, Dev 20 app-shell and launch polish, Dev 21 route redesign/visual QA, Version 22 curated cross-domain taxonomy validation, Version 23 saved-analysis data controls, and Version 24 observability are complete in the repository. **Version 25 is complete.** Custom-domain configuration, Clerk Production migration, canonical metadata, provider reconciliation, canonical-host Production verification, and final documentation closeout are complete. Canonical-host Production verification passed on commit `0ceb8b88a602f349e1de89e4fd9bf00e5725939d` with Version 23 17/17 and Version 25 7/7 automated results plus manual verification, cleanup, and rollback readiness. Portfolio publication and broader promotion are intentionally deferred. Formal accessibility certification and security certification have not been declared complete.

## Current frontend surfaces

- Public landing page with Smart AI and rule-based positioning, curated cross-domain taxonomy copy, current feature proof, and privacy/data-control links.
- Clerk sign-in and sign-up routes with product context.
- Protected `/dashboard` workspace.
- Dashboard `POST /api/analyze` proxy to Render FastAPI rule-based analysis.
- Optional Smart AI analysis via `POST /api/ai/analyze` with quota tracking and automatic rule-based fallback.
- Optional Smart AI résumé profile extraction via `POST /api/ai/extract-profile` with deterministic fallback.
- Transient pasted text and transient PDF, DOCX, TXT, and MD upload support (deterministic extraction; not AI/OCR).
- **Try sample inputs** and **Run analysis (does not save)** workflow labels, currently using a fictional Supply Chain Operations Analyst Intern sample for Northstar Distribution.
- Structured resume profiles with profile metadata and skill lists.
- Saved-profile analysis handoff that constructs temporary analysis input from selected profile metadata and skills.
- **Save structured results** for matched/missing skills, categories, counts, timestamps, job metadata, and notes.
- Saved-analysis history with progressive pages of ten, manual **Load more analyses**, detail view, search/filter across loaded pages, comparison, recurring-gap statistics, loaded CSV export, row multi-selection, **Select all visible**, selected CSV export, individual deletion, and selected deletion for checked currently loaded analyses after confirmation with partial-failure handling.
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

## Current Production integration posture

- Canonical frontend monitoring target: `https://jobfit.cooperrobillard.com/` (`Job Fit Analyzer — Canonical Frontend`).
- Old Vercel fallback monitoring target: `https://internship-fit-gap-analyzer.vercel.app/` (`Job Fit Analyzer — Vercel Fallback`).
- Render backend health monitoring target: `https://internship-fit-gap-analyzer.onrender.com/health` (`Job Fit Analyzer — Backend Health`).
- Browser analysis uses the same-origin Next.js `POST /api/analyze` route.
- The Next.js server calls Render FastAPI server-to-server; browser code does not call Render directly in the Production analysis flow.
- Render CORS required no change for the canonical hostname because the public hostname change did not create a direct browser-to-Render request path. The verified Render `ALLOWED_ORIGINS` posture is explicit and nonwildcard.
- Generated Vercel Preview URLs are constrained as designed: public Preview routes may be reviewed, but Production authentication is not expected on arbitrary generated Preview hostnames.

## Privacy posture

- Rule-based analysis uses explicit taxonomy phrases and reviewed aliases when Smart AI is unavailable or selected.
- When enabled, Smart AI mode sends transient résumé/job text to OpenAI for the current request only; rule-based fallback remains available.
- OpenAI API content is not used for training by default, but platform abuse monitoring/application-state handling may apply.
- Pasted or uploaded resume/job documents are processed transiently for the request. Files and raw extracted bodies are not saved by the application save path.
- The application save path does not intentionally persist raw resume body text or raw job-description body text.
- Saved analyses store structured results and metadata.
- Structured profiles store profile metadata and skill names, not raw resume body text.
- Platform or service logging cannot be guaranteed absent; avoid unusually sensitive content.
- Dev 19 recorded two-user RLS verification and abuse/rate-limit evidence, but this is not a formal security audit, penetration test, or legal privacy-policy review.

Supporting records:

- [`../docs/VERSION_22_CHECKPOINT.md`](../docs/VERSION_22_CHECKPOINT.md)
- [`../docs/VERSION_23_CHECKPOINT.md`](../docs/VERSION_23_CHECKPOINT.md)
- [`../docs/VERSION_23_DATA_CONTROL_QA.md`](../docs/VERSION_23_DATA_CONTROL_QA.md)
- [`../docs/VERSION_24_RELEASE_DIRECTION.md`](../docs/VERSION_24_RELEASE_DIRECTION.md)
- [`../docs/TAXONOMY_MAINTENANCE.md`](../docs/TAXONOMY_MAINTENANCE.md)

- [`../docs/DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md`](../docs/DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md)
- [`../docs/DEV19_RLS_AUTH_REVERIFICATION.md`](../docs/DEV19_RLS_AUTH_REVERIFICATION.md)
- [`../docs/DEV19_ABUSE_RATE_LIMIT_REVIEW.md`](../docs/DEV19_ABUSE_RATE_LIMIT_REVIEW.md)
- [`../docs/DEV20_LIMITED_PUBLIC_BETA_LAUNCH_READINESS.md`](../docs/DEV20_LIMITED_PUBLIC_BETA_LAUNCH_READINESS.md)
- [`../docs/VERSION_25_STEP_6_PRODUCTION_VERIFICATION.md`](../docs/VERSION_25_STEP_6_PRODUCTION_VERIFICATION.md)
- [`../docs/VERSION_25_STEP_7_PROJECT_CLOSEOUT.md`](../docs/VERSION_25_STEP_7_PROJECT_CLOSEOUT.md)

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

## Route discovery and search status

| Route | Search status |
| --- | --- |
| `/` | Canonical and indexable |
| `/privacy` | Canonical and indexable |
| `/sign-in` | No-index |
| `/sign-up` | No-index |
| `/dashboard` | Protected and no-index |
| `/robots.txt` | Public metadata route |
| `/sitemap.xml` | Public metadata route |

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
| Smart AI (optional) | `AI_FEATURES_ENABLED`, `AI_DAILY_LIMIT`, `AI_MONTHLY_LIMIT`, `AI_PROFILE_MONTHLY_LIMIT` | Vercel server-side only. Render also needs `OPENAI_API_KEY` and related backend vars. |
| Smart AI quota bypass (optional) | `AI_QUOTA_BYPASS_USER_IDS` | Server-only comma-separated Clerk user IDs for owner/admin testing. Bypasses daily/monthly Smart AI and profile-extraction quota enforcement and quota-exceeded alert emails for listed users only. Does not change limits for normal users. Never use `NEXT_PUBLIC_*`. |

Do not put server secrets in `NEXT_PUBLIC_*` variables. Do not use Supabase service-role credentials in browser/client code. Do not add `NEXT_PUBLIC_OPENAI_API_KEY` or `NEXT_PUBLIC_RESEND_API_KEY`.

### Quota alert email (optional)

| Variable | Notes |
|---|---|
| `RESEND_API_KEY` | Server-only Resend API key for quota alert emails |
| `AI_QUOTA_ALERT_EMAIL` | Recipient for quota-exceeded alerts (e.g. `cooper.robillard@gmail.com`) |
| `ALERTS_FROM_EMAIL` | Verified Resend sender address |

When configured, the app sends one safe metadata-only email per user/feature/quota window when Smart AI quota is exceeded. Alerts include feature, limit type, counts, Clerk user id, timestamp, and environment only — never résumé/job text.

### Tip jar nudge (optional)

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_TIP_JAR_URL` | External support link (e.g. Ko-fi/Buy Me a Coffee). Hidden when unset. |
| `NEXT_PUBLIC_TIP_PROMPT_ANALYSIS_THRESHOLD` | Successful analyses before the nudge appears (default `5`) |

The tip jar is dismissible dashboard UI only. It does not affect analysis results, quotas, or payments inside the app.

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

## Smart AI / OpenAI troubleshooting (developer notes)

If the OpenAI dashboard shows zero usage after Smart AI runs:

- Confirm Render uses an `OPENAI_API_KEY` from the intended OpenAI project.
- Check Supabase `ai_usage_events` for successful rows and token counts for the signed-in user.
- Very small spend may round to `$0.00`, but token counts should appear when calls reach OpenAI.
- If quota rows show `error` status or the UI reports rule-based fallback, the app may not be making paid OpenAI calls.

## Current limits

- Limited public beta/portfolio software, not mature production SaaS.
- Smart AI is optional and quota-limited; rule-based analysis remains available as fallback. PDF/DOCX support is deterministic text extraction only (not OCR). No application tracking, billing, or organization features.
- No account-wide select-all, account-wide export, account-wide delete-all, automated retention, restore/undo, or automatic Clerk-account-to-Supabase cleanup guarantee; selected deletion and exports are limited to records currently loaded in the browser.
- Version 24 observability is complete for its bounded privacy-safe scope: sanitized server-side Sentry failure delivery, UptimeRobot canonical frontend, Vercel fallback, and backend health monitors, plus the production incident-response runbook. This is not a formal security audit, penetration test, legal review, compliance certification, or mature-SaaS claim.
- Version 25 custom-domain configuration, Clerk Production migration, canonical metadata, provider reconciliation, and canonical-host Production verification are complete. Portfolio publication and broader promotion are intentionally deferred.
- Formal accessibility certification and security certification are not complete.

## Version 23 production QA status

Version 23 saved-analysis data-control production Playwright end-to-end QA passed against production commit `5a6293eb3103cf2b73eb7c60fad5524b2bd4aee2` on `internship-fit-gap-analyzer.vercel.app`, with Render health returning HTTP 200 status `ok`. The accepted run covered two-user RLS isolation, structured save/detail, pagination and incremental failure/retry, search/filter across loaded pages, selection, selected CSV, loaded CSV, selected-deletion cancel/success/unavailable/partial-failure/complete-failure paths, individual deletion regression, keyboard behavior, responsive behavior, and cleanup. The evidence is scoped to Version 23 data controls and is not a formal security audit, penetration test, or accessibility certification.

## Saved-analysis load more

The dashboard saved-analysis list initially loads 10 records and offers a manual **Load more analyses** button for additional pages of 10. Search, selection, selected export, loaded export, selected deletion, detail, and Compare expand across the pages currently loaded in the browser. These controls still are not account-wide: unloaded records are not selected, exported, deleted, compared, or searched until the user loads more history.
