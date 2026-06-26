# Version 23 production QA automation

This folder contains the local-only Playwright production-QA checkpoint for Version 23 saved-analysis data controls. It does not change application runtime behavior and does not mark Version 23 Step 5 complete.

## Prerequisites

- Two dedicated Clerk QA users that contain only synthetic QA data.
- Vercel token with read access to inspect the production deployment for `QA_BASE_URL`.
- Supabase elevated key for local Node-only seeding/cleanup when `QA_SEED_MODE=admin`.
- Node dependencies installed with `npm install` and Chromium installed with `npm run qa:version23:setup`.

## Local configuration

Copy `web/.env.qa.example` to `web/.env.qa.local` and fill values locally. Never commit the local file.

Required values come from:

- `QA_BASE_URL`: HTTPS production Vercel URL to test.
- `QA_RENDER_HEALTH_URL`: Render health URL, defaulting to `https://internship-fit-gap-analyzer.onrender.com/health`.
- `QA_EXPECTED_COMMIT`: expected production commit, currently `5a6293eb3103cf2b73eb7c60fad5524b2bd4aee2`.
- `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`: Clerk project keys. `CLERK_SECRET_KEY` is Node-only for `@clerk/testing/playwright` and must never reach the browser.
- `QA_USER_A_EMAIL` and `QA_USER_B_EMAIL`: two different existing QA users.
- `SUPABASE_URL` and either `SUPABASE_SECRET_KEY` or legacy `SUPABASE_SERVICE_ROLE_KEY`: used only by Node helper code for admin seed/cleanup.
- `VERCEL_TOKEN` and optional `VERCEL_TEAM_ID`: used only to inspect deployment metadata.
- `QA_CONFIRM_PRODUCTION_MUTATION`: must exactly equal `CREATE_AND_DELETE_SYNTHETIC_V23_QA_DATA`.

## Commands

```bash
cd web
npm install
npm run qa:version23:setup
npm run qa:version23:production
```

Cleanup helpers:

```bash
npm run qa:version23:cleanup:dry-run
npm run qa:version23:cleanup
QA_CONFIRM_STALE_CLEANUP=DELETE_STALE_V23_QA_DATA npm run qa:version23:cleanup:stale
```

Reports are generated at:

- `/tmp/version23-data-control-qa.md`
- `web/test-results/version23-results.json`
- `web/playwright-report/index.html`

## Clerk authentication

Production QA uses Clerk's supported Playwright integration:

- `clerk.setup.ts` runs `clerkSetup()` in a dedicated setup project.
- Tests call `clerk.signIn({ page, emailAddress })` after visiting an unprotected page that loads Clerk.
- Authentication is verified with the signed-in `UserButton` and dashboard access, not by filling the email field alone.
- OTP retrieval is not automated.
- If Clerk testing cannot operate with the configured production instance, the suite fails with a precise configuration error.

### Ignored storage-state alternative

You may capture `storageState` after a manual sign-in for local debugging, but storage state is not a substitute for `clerk.signIn` verification in this suite. Do not mark authentication as passed when only storage state is loaded.

## Cleanup model

Every run creates a unique `V23 QA <run-id>` prefix and records exact created IDs in an ignored manifest under `web/test-results/`. The Node runner and Playwright teardown both attempt current-run cleanup idempotently. Cleanup deletes only manifest IDs where the owner is one of the configured QA users, company is `Version 23 QA Company`, and the title starts with the current run prefix.

If cleanup fails, the Markdown verdict is FAIL and the report prints the safe retry command.

## Seed modes

`QA_SEED_MODE=admin` is the default fast path. The elevated Supabase key is loaded only in Node Playwright helper code and is never passed to browser contexts, `page.evaluate`, local storage, cookies, traces, screenshots, or client bundles.

`QA_SEED_MODE=ui` avoids elevated Supabase access but can be slower and can hit production rate limits because it creates records only through authenticated application behavior.

## Security warnings

Do not commit Clerk, Supabase, Vercel, session, storage-state, CSV download, screenshot, trace, video, HTML report, or Markdown evidence artifacts. The `.gitignore` entries added by this task cover the expected local files.

## Troubleshooting

- Clerk bot detection: use dedicated QA users and Clerk's supported testing configuration for the project; do not automate OTP retrieval.
- Vercel team scope: set `VERCEL_TEAM_ID` when the deployment belongs to a team scope.
- Font fetch-only build failures: record the failure honestly; do not alter fonts or app code merely to hide an environment-only Geist fetch issue.
- Request matcher does not fire: inspect the actual network request and narrow the matcher to the saved-analysis list or delete request only; the test fails rather than silently passing if an expected matcher is never observed.
