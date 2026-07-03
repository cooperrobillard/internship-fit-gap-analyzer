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

The suite writes an exact profile manifest containing current-run profile records and expected owners. Creation-time profile names remain as current-run provenance only. The Node-only cleanup helper validates ownership, deletes only exact manifest entries by immutable profile ID plus expected owner ID, and verifies those exact IDs no longer remain even if a profile display name changed during the run. Ordinary cleanup does not use broad prefix deletion.

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

## First Step 6B Production run (sanitized)

The first Version 25 Step 6B Production checkpoint on commit `d427d8f501d0d41f5a1f6befa73efdfeaf89bbec` completed exactly once and returned a strict automated **FAIL**:

- exact Vercel Production commit verification, Render health, local preflight, Version 23 browser coverage, and cleanup passed;
- Version 25 failed because metadata expectations used the global site description instead of the homepage-specific description already served by Production;
- the Version 25 Playwright handoff removed `test-results/version23-results.json` before consolidated reporting;
- manual Step 6B checks were not started;
- portfolio publication remains blocked.

Remediation requires merging the scoped handoff fix, waiting for its exact merged commit to deploy, updating ignored local `QA_EXPECTED_COMMIT`, and rerunning the complete Step 6B checkpoint exactly once. No partial successful result may be promoted into PASS.

The second Step 6B run returned strict FAIL after the handoff remediation passed. The homepage Twitter card remained incorrect because the page-level metadata object omitted the card, and Version 23 cleanup dry-run produced a false positive by counting retained manifest entries instead of querying exact current-run Production rows. Manual checks were not started. Follow-up remediation adds the explicit Twitter card, preserves the manifest for audit, and makes dry-run verify actual exact current-run database residuals.

The third Step 6B run returned strict FAIL after those remediations passed. Version 23 automation, cleanup, and machine-artifact handoff passed. Version 25 stopped at exact sitemap verification because the application helper emitted the homepage URL without a trailing slash while the launch canonical contract requires `https://jobfit.cooperrobillard.com/`. Manual checks were not started. Follow-up remediation standardizes the shared `absoluteSiteUrl("/")` helper and sitemap expectations on the trailing-slash root without changing visible page copy.

The fourth Step 6B run on commit `4a0370cdf8cb6eca39192bab2042cb051087dfe1` (run ID `20260703214518-id1jwg`) returned strict FAIL after that sitemap remediation verified live. Version 23 passed 17/17; both cleanup paths and both post-run dry runs passed. Version 25 failed in the first serial spec because the old-host check used a raw exact-slash HTML substring while Next.js 16.2.9 renders queryless root canonical and `og:url` as the origin form. The remaining five Version 25 specs were skipped; manual checks were not started; Step 6C was not created; the suite was not rerun. Follow-up remediation is QA-only and uses the existing semantic canonical normalizer for old-host browser metadata without weakening the exact sitemap contract.

## Rollback-readiness boundary

Rollback readiness is a manual Step 6B review item. This foundation records it as pending only.

## Next phase

Version 25 Step 6B — Production execution and human verification.
