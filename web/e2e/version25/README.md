# Version 25 launch-verification QA

This directory adds the Version 25 Step 6A Playwright foundation. It is a separate launch-verification layer and does not replace or weaken the Version 23 Production QA suite.

## Scope

The Version 25 suite is intended to run after the complete Version 23 Production suite and covers canonical metadata, authentication/session boundaries, direct sample analysis, structured profile CRUD/use, two-user profile isolation, responsive route smoke checks, accessibility smoke checks, exact profile cleanup, and bounded reporting.

The suite uses synthetic QA data only. It must not use real résumé text, real job-description text, or real candidate information.

## Relationship to Version 23

`qa:version25:production` runs `qa:version23:production` first. If Version 23 fails, Version 25 launch checks do not run. Version 23 remains responsible for saved-analysis seeding, saved-analysis RLS, exports, pagination, deletion behavior, and saved-workspace keyboard/responsive checks.

## Required local QA configuration

Use the same ignored local QA configuration required by Version 23. Do not commit environment files or print configured user identities, tokens, row IDs, or credentials. Two dedicated synthetic Clerk QA users are required.

## Production mutation acknowledgement

The future Step 6B run mutates Production by creating and deleting synthetic structured profiles. Do not run it until the exact merged commit has deployed to Production and the operator intentionally acknowledges Production mutation.

## Commands for Step 6B

1. Confirm the merged commit is deployed to the canonical hostname.
2. Run `npm run qa:version25:setup` if Chromium is not already installed.
3. Run `npm run qa:version25:production`.
4. If needed, run `npm run qa:version25:cleanup:dry-run`.
5. If cleanup is required, run `npm run qa:version25:cleanup`.
6. Review `/tmp/version25-production-verification.md` and `web/test-results/version25-report-summary.json`.
7. Complete manual checks before recording Step 6 PASS/FAIL.

Do not run `qa:version25:production` before the exact merged commit is deployed.

## Cleanup behavior

The manifest at `web/test-results/version25-profile-manifest-<run-id>.json` tracks exact current-run profile IDs and expected owner IDs. Creation-time profile names remain in the manifest as current-run provenance only. Node-only cleanup validates ownership, deletes only exact manifest records by immutable profile ID plus expected owner ID, and verifies those exact IDs no longer remain even if the display name changed during the run. Ordinary cleanup never performs broad prefix deletion.

## Manual-check boundary

The report leaves manual accessibility, Production sign-up, Google OAuth, account portal, Sentry, UptimeRobot, and rollback-readiness checks pending. This suite does not claim WCAG certification, accessibility certification, formal conformance, or final public-launch readiness.

## Stop conditions

Stop if credentials are missing, the deployed commit is not the expected commit, Render health fails, Clerk QA users cannot be verified, cross-user profile visibility is detected, cleanup cannot verify exact ownership, or generated artifacts include sensitive data.

## Failure handling

The runner preserves the first failing automated status even if fallback cleanup or report generation also fails. Report generation must not turn pending manual checks into PASS.

## First Step 6B Production run (sanitized)

The first Version 25 Step 6B Production checkpoint on commit `d427d8f501d0d41f5a1f6befa73efdfeaf89bbec` completed exactly once and returned a strict automated **FAIL**:

- deployment verification, preflight, Version 23 browser coverage, and cleanup passed;
- Version 25 failed on homepage metadata expectations;
- the combined runner lost the Version 23 JSON machine artifact during the Version 25 Playwright handoff;
- manual Step 6B checks were not started;
- no partial result may be promoted to PASS.

Remediation centralizes the existing homepage metadata description as `HOME_DESCRIPTION`, isolates Version 25 Playwright artifacts from `test-results/version23-results.json`, and adds explicit artifact guards in the combined runner. After remediation merges and deploys, rerun the complete Step 6B checkpoint from the beginning exactly once.

The second Step 6B run returned strict FAIL after those fixes passed. The homepage page-level Twitter metadata omitted the required large-image card, and Version 23 cleanup dry-run falsely counted retained manifest entries instead of querying exact current-run Production rows. Manual checks were not started. A follow-up remediation adds the explicit Twitter card and makes dry-run verify actual database residuals while preserving the manifest for audit.

The third Step 6B run returned strict FAIL after those remediations passed. Version 23 automation, cleanup, and machine-artifact handoff passed. Version 25 stopped at exact sitemap verification because `absoluteSiteUrl("/")` emitted the homepage without a trailing slash while the launch canonical contract requires the slash root. Manual checks were not started. Follow-up remediation standardizes the shared helper and sitemap expectations on `https://jobfit.cooperrobillard.com/` without changing visible page copy.

## Next phase

Version 25 Step 6B — Production execution and human verification.
