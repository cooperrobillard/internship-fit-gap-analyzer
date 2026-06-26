# Version 23 production QA automation

This folder contains the local-only Playwright production-QA checkpoint for Version 23 saved-analysis data controls. It does not change application runtime behavior and does not mark Version 23 Step 5 complete.

## Prerequisites

- Two dedicated Clerk QA users that contain only synthetic QA data.
- Vercel token with read access to inspect the production deployment for `QA_BASE_URL`.
- Supabase elevated key for local Node-only seeding/cleanup when `QA_SEED_MODE=admin`.
- Node dependencies installed with `npm ci` and Chromium installed with `npm run qa:version23:setup`.

## Local configuration

Copy `web/.env.qa.example` to `web/.env.qa.local` and fill values locally. Never commit the local file.

Required values come from:

- `QA_BASE_URL`: HTTPS production Vercel URL to test.
- `QA_RENDER_HEALTH_URL`: Render health URL, defaulting to `https://internship-fit-gap-analyzer.onrender.com/health`.
- `QA_EXPECTED_COMMIT`: expected production commit, currently `5a6293eb3103cf2b73eb7c60fad5524b2bd4aee2`.
- `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`: Clerk project keys for resolving and signing in dedicated QA users.
- `QA_USER_A_EMAIL` and `QA_USER_B_EMAIL`: two different existing QA users.
- `SUPABASE_URL` and either `SUPABASE_SECRET_KEY` or legacy `SUPABASE_SERVICE_ROLE_KEY`: used only by Node helper code for admin seed/cleanup.
- `VERCEL_TOKEN` and optional `VERCEL_SCOPE`: used only to inspect deployment metadata.
- `QA_CONFIRM_PRODUCTION_MUTATION`: must exactly equal `CREATE_AND_DELETE_SYNTHETIC_V23_QA_DATA`.

## Commands

```bash
cd web
npm run qa:version23:setup
npm run qa:version23:production
```

Reports are generated at:

- `/tmp/version23-data-control-qa.md`
- `web/test-results/version23-results.json`
- `web/playwright-report/index.html`

## Cleanup model

Every run creates a unique `V23 QA <run-id>` prefix and records exact created IDs in an ignored manifest under `web/test-results/`. Global teardown deletes only current-run IDs where the owner is one of the configured QA users, company is `Version 23 QA Company`, and the title starts with the current run prefix. It does not use a broad prefix delete as the primary cleanup path.

If cleanup fails, the Markdown verdict is FAIL and the report prints the safe retry command. A stale-QA cleanup flow must be run separately and should first be dry-run with `npm run qa:version23:cleanup:dry-run`.

## Seed modes

`QA_SEED_MODE=admin` is the default fast path. The elevated Supabase key is loaded only in Node Playwright helper code and is never passed to browser contexts, `page.evaluate`, local storage, cookies, traces, screenshots, or client bundles.

`QA_SEED_MODE=ui` avoids elevated Supabase access but can be slower and can hit production rate limits because it creates records only through authenticated application behavior.

## Security warnings

Do not commit Clerk, Supabase, Vercel, session, storage-state, CSV download, screenshot, trace, video, HTML report, or Markdown evidence artifacts. The `.gitignore` entries added by this task cover the expected local files.

## Troubleshooting

- Clerk bot detection: use dedicated QA users and Clerk's supported testing configuration for the project; do not automate OTP retrieval.
- Vercel scope: set `VERCEL_SCOPE` when the deployment belongs to a team scope.
- Font fetch-only build failures: record the failure honestly; do not alter fonts or app code merely to hide an environment-only Geist fetch issue.
- Request matcher does not fire: inspect the actual network request and narrow the matcher to the saved-analysis list or delete request only; the test should fail rather than silently pass if an expected matcher is never observed.
