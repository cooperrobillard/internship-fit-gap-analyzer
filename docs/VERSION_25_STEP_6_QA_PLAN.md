# Version 25 Step 6 QA plan

Version 25 Step 6A adds a QA-only launch-verification foundation. It prepares automated Production checks but does not execute Production-mutating QA from Codex.

## Suite scope

The Version 25 launch suite verifies canonical metadata, authentication/session boundaries, direct synthetic sample analysis, structured profile create/read/update/use/delete behavior, two-user structured-profile isolation, responsive route smoke checks, accessibility smoke checks, exact cleanup, and bounded reporting.

## Relationship to Version 23

Version 23 remains the preserved Production QA foundation for saved-analysis data controls. The Version 25 runner runs `qa:version23:production` first and exits immediately if it fails. Version 25 does not duplicate or weaken Version 23 coverage.

## Required local QA configuration

Operators must use ignored local QA configuration compatible with Version 23. The suite requires the canonical Production base URL, Render health URL, expected deployed commit, Vercel verification access, Clerk QA-user verification, Supabase URL, and Node-only elevated Supabase access for exact cleanup. Do not commit real values, credentials, user identities, or IDs.

## Dedicated synthetic QA users

Two existing synthetic Clerk QA users are required. The suite must not create Clerk users, run Production sign-up, run Google OAuth, or perform destructive account-management checks.

## Production mutation acknowledgement

Step 6B will create and delete synthetic structured profiles in Production. The acknowledgement must be explicit and local. No real résumé or job-description content may be used.

## Future Step 6B command order

1. Merge the QA-only foundation.
2. Wait for the exact merged commit to deploy to `https://jobfit.cooperrobillard.com`.
3. Confirm ignored local QA configuration is present in the operator environment.
4. Run `cd web && npm run qa:version25:setup` if Chromium is not installed.
5. Run `npm run qa:version25:production`.
6. Review `/tmp/version25-production-verification.md` and `web/test-results/version25-report-summary.json`.
7. Run `npm run qa:version25:cleanup:dry-run` if cleanup status needs verification.
8. Run `npm run qa:version25:cleanup` if cleanup is required.
9. Complete all manual Step 6B checks.
10. Determine the strict Step 6 PASS/FAIL verdict.

Do not run the Production suite before the exact merged commit is deployed.

## Report locations

The human-readable report is `/tmp/version25-production-verification.md`. Machine-readable output is under ignored `web/test-results/`. HTML Playwright output is under ignored `web/playwright-report/`.

## Exact cleanup behavior

The suite writes an exact profile manifest containing current-run profile records and expected owners. The Node-only cleanup helper validates ownership, deletes only exact manifest entries, and verifies no current-run IDs remain. Ordinary cleanup does not use broad prefix deletion.

## Cleanup dry run

`npm run qa:version25:cleanup:dry-run` verifies what would be processed without deleting records. It must not print profile IDs, owner IDs, QA emails, credentials, tokens, or row identifiers.

## Manual-check boundary

Manual accessibility, Production sign-up, Google OAuth, account portal, Sentry observation, UptimeRobot observation, and rollback-readiness review remain pending in the automated report. The report must not claim final public-launch readiness or a final Step 6 PASS.

## Privacy requirements

Use synthetic text only. Do not store raw pasted résumé or job-description text by default. Do not add raw résumé storage, PDF/DOCX parsing, AI extraction, semantic matching, or application tracking as part of this QA foundation.

## Stop conditions

Stop if the deployed commit is not expected, Render health fails, Clerk QA users cannot be verified, cross-user visibility is detected, exact cleanup cannot validate ownership, sensitive data appears in reports, or the task would require Production credentials not already configured by the human operator.

## Failure handling

The runner preserves the original failing status even if cleanup or report generation also fails. Required automated output must exist. Missing manual checks remain pending and never become PASS automatically.

## Rollback-readiness boundary

Rollback readiness is a manual Step 6B review item. This foundation records it as pending only.

## Next phase

Version 25 Step 6B — Production execution and human verification.
