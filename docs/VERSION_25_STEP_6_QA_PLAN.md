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

The fifth Step 6B run on commit `93b02b63c71450b33503c66fb70d135e649177c0` (run ID `20260703221025-lmlq6y`) returned strict FAIL after metadata and canonical-host verification passed. Version 23 passed 17/17. Version 25 authentication and session boundary failed because the test waited for a `menuitem` named Sign out while Clerk renders that action as a button in the UserButton popover. The remaining four Version 25 specs did not run; cleanup completed and the report was generated; manual checks were not started; Step 6C was not created; the suite was not rerun. Follow-up remediation is QA-only and aligns the sign-out selector with Clerk's UserButton button contract.

The sixth Step 6B run on commit `5469b0f6b8f3e2fda43d5d47c4231b114fd51c5c` (run ID `20260703223057-9k0pcp`) returned strict FAIL after metadata/canonical-host verification and the corrected Clerk UserButton selector path passed. Version 23 passed 17/17. Authentication and session boundary failed because the test navigated to `/dashboard` immediately after clicking Sign out without waiting for Clerk's asynchronous signed-out state; the route remained `/dashboard` for the 30-second assertion timeout. The remaining four Version 25 specs did not run; cleanup completed and the report was generated; manual checks were not started; Step 6C was not created; the suite was not rerun. Follow-up remediation is QA-only and adds an observable signed-out completion barrier before the protected-route assertion.

The seventh Step 6B run on commit `c664639071c5f4e4ac4aad8936ac7d4ea85e5373` (run ID `20260704005535-4x6k0m`) returned strict FAIL after Version 23 passed 17/17, Version 25 Clerk setup passed, public metadata/canonical-host verification passed, and authentication/session boundary passed (confirming the prior sign-out remediation). Direct sample analysis timed out after 240 seconds waiting for the "Use sample inputs" button because the test opened the protected `/dashboard` route in a fresh Playwright test context without authenticating; authentication from the preceding test could not carry over because Playwright isolates tests. The remaining three Version 25 specs did not run; cleanup completed and the report was generated; manual checks were not started; Step 6C was not created; the suite was not rerun. Follow-up remediation is QA-only and adds explicit authentication plus a dashboard-readiness assertion to the sample-analysis checkpoint. Another complete fresh Step 6B checkpoint is required after merge and exact Production deployment.

The eighth Step 6B run on commit `b7759c7a71577e1af5fb95e606fe3951f6696c9d` (run ID `20260704014022-wny2gc`) returned strict FAIL after Version 23 passed 17/17, Version 25 Clerk setup passed, public metadata/canonical-host verification passed, and authentication/session boundary passed. Direct sample analysis authenticated successfully, loaded the sample, ran analysis, and reached "Analysis complete"; the assertion then received an empty matched-skill array because the QA locator searched the heading's immediate parent while the `<ul>` is a sibling under the outer `SkillList` wrapper. The remaining three Version 25 specs did not run; cleanup completed and the report was generated; manual checks were not started; Step 6C was not created; the suite was not rerun. Follow-up remediation is QA-only and scopes the locator to the outer skill-list wrapper. Another complete fresh Step 6B checkpoint is required after merge and exact Production deployment.

The ninth Step 6B run on commit `619ba6c24d86f5bdf0f12c0fcd3045bb9b219109` (run ID `20260704015949-lgwryb`) returned strict FAIL after Version 23 passed 17/17, Version 25 Clerk setup passed, public metadata/canonical-host verification passed, and authentication/session boundary passed. Direct sample analysis authenticated, loaded the sample, ran successfully, reached "Analysis complete," and found exactly four matched and five missing list items; matched-skill extraction returned skill/category concatenations because `collectSkills()` read each complete `<li>` text and attempted to split on an em dash that is not present in the markup. The visible values contained the four expected matched skill labels plus their category labels; exact missing-skill verification was not reached because matched verification threw first. The remaining three Version 25 specs did not run; cleanup completed and the report was generated; manual checks were not started; Step 6C was not created; the suite was not rerun. Follow-up remediation is QA-only and extracts the first nested skill-label element without relying on CSS classes, categories, expected names, or delimiters. Another complete fresh Step 6B checkpoint is required after merge and exact Production deployment.

The tenth Step 6B run on commit `afe943f00f0853daa4d4a1c9b77792b208fa42a8` (run ID `20260704021053-shha01`) returned strict FAIL after Version 23 passed 17/17, Version 25 Clerk setup passed, public metadata/canonical-host verification passed, authentication/session boundary passed, and direct sample analysis passed completely including exact matched/missing skill verification, same-origin behavior, and safe UI assertions. Structured profile CRUD/use and two-user isolation began running; `createProfile()` found the Source type control but timed out calling `selectOption("manual")` because the control is inside the closed "Advanced profile details" `<details>` element—the control exists in the DOM but is not visible, while application runtime already initializes new profiles with Source type `manual`. Responsive and accessibility tests did not run; cleanup completed and the report was generated; manual checks were not started; Step 6C was not created; the suite was not rerun. Follow-up remediation is QA-only and asserts the existing hidden control value without interacting with or changing it. Another complete fresh Step 6B checkpoint is required after merge and exact Production deployment.

The eleventh Step 6B run on commit `50c93326d28c890481295c7f3158b18b3b65a075` (run ID `20260704023919-jb7hav`) returned strict FAIL after Version 23 passed 17/17, Version 25 Clerk setup passed, public metadata/canonical-host verification passed, authentication/session boundary passed, and direct sample analysis passed completely. The Source type default assertion passed; profile creation then failed because the page-wide exact Create profile locator resolved both the empty-workspace launcher and the active form submit action—no profile was submitted before the strict-mode failure. Source inspection also found that the next profile-detail assertion incorrectly expected `Manual entry`, while the profile-management detail UI renders `Manual` inside the closed Profile details disclosure. Remediation scopes submission to the unique form containing the exact New profile heading and verifies the persisted Manual value inside the opened Profile details disclosure. Responsive and accessibility tests did not run; cleanup completed and the report was generated; manual checks were not started; Step 6C was not created; the suite was not rerun. Another complete fresh Step 6B checkpoint is required after merge and exact Production deployment.

The twelfth Step 6B run on commit `18beb3d9015b0b150a899f5ca701550a8195adbb` (run ID `20260704025631-tnlhku`) returned strict FAIL after Version 23 passed 17/17 and Version 25 Clerk setup, public metadata/canonical-host verification, authentication/session boundary, and direct sample analysis passed. Structured profile creation succeeded through profile-created confirmation and exact selected-profile heading verification; the test then failed because a page-wide profile-notes locator resolved the same notes text in both the profile-list card and the selected profile detail summary. Responsive and accessibility smoke tests did not run because the suite is serial; exact cleanup completed and the report was generated; formal Step 6B verdict remains FAIL. Remediation is QA-only and scopes the notes assertion to the selected profile summary container anchored on the exact profile heading. Another complete fresh Step 6B checkpoint is required after merge and exact Production deployment of this remediation.

The thirteenth Step 6B run on commit `599b078734c6a3277885ac0a37b21acd91ff7513` (run ID `20260704032054-4xnj9n`) returned strict FAIL after Version 23 passed 17/17 and Version 25 Clerk setup, public metadata/canonical-host verification, authentication/session boundary, and direct sample analysis passed. The selected-profile notes assertion passed and profile creation succeeded; the test then failed because a page-wide Created timestamp locator matched both the profile-created status message and the exact Created field inside the Profile details disclosure. Responsive and accessibility smoke tests did not run because the suite is serial; exact cleanup completed and the report was generated; formal Step 6B verdict remains FAIL. Remediation is QA-only and scopes Created and Updated timestamp assertions inside the opened Profile details disclosure. Another complete fresh Step 6B checkpoint is required after merge and exact Production deployment of this remediation.

The fourteenth Step 6B run on commit `79cb73c0f7f5337866a48cdb93d3ee9912d647f4` (run ID `20260704033340-wl1ezk`) returned strict FAIL after Version 23 passed 17/17 and Version 25 Clerk setup, public metadata/canonical-host verification, authentication/session boundary, and direct sample analysis passed. Profile create/detail/edit assertions reached and passed; the test then failed because `getByLabel("Saved profile")` resolved both the Saved profile radio button and the Saved profile combobox. Responsive and accessibility smoke tests did not run because the suite is serial; cleanup completed and the report was generated; formal Step 6B verdict remains FAIL. Remediation is QA-only and replaces ambiguous Saved profile locators with role-specific radio/combobox selectors, scopes the selected-profile preview through Profile source details, and audits remaining profile/responsive/accessibility locators for strict uniqueness. Another complete fresh Step 6B checkpoint is required after merge and exact Production deployment of this remediation.

The fifteenth Step 6B run on commit `0e33ad056dcf9bb156cc2a92b96b7be4f98ab52b` (run ID `20260704034712-1pkmav`) returned strict FAIL after Version 23 passed 17/17 and Version 25 Clerk setup, public metadata/canonical-host verification, authentication/session boundary, and direct sample analysis passed. User A profile create/detail/edit/select/analyze flow passed and switching to QA User B passed; User B profile creation then failed because the empty profile workspace legitimately exposes both an exact New profile header action and an exact Create profile empty-state action while the QA locator combined both names and asserted uniqueness. Responsive and accessibility smoke tests did not run because the suite is serial; cleanup completed and the report was generated; formal Step 6B verdict remains FAIL. Remediation is QA-only and targets the persistent exact New profile header action for create, responsive, and accessibility flows. Another complete fresh Step 6B checkpoint is required after merge and exact Production deployment of this remediation.

The sixteenth Step 6B run on commit `0ef85ba1b105ac4d9d067e9a3e0f011add930671` (run ID `20260704040022-vrlb7m`) returned strict FAIL after Version 23 passed 17/17 and Version 25 Clerk setup, public metadata/canonical-host verification, authentication/session boundary, and direct sample analysis passed. User A profile create/detail/edit/select/analyze passed, User B profile creation passed, switching between both QA users passed, and two-user profile isolation passed in both directions; final User A profile-row selection for UI deletion then failed because the row button's accessible name includes profile notes, skill count, and updated date while the QA locator required an exact profile-name-only match. Responsive and accessibility smoke tests did not run because the suite is serial; cleanup completed and the report was generated; formal Step 6B verdict remains FAIL. Remediation is QA-only and selects the profile row through button role filtered by an exact profile-name descendant. Another complete fresh Step 6B checkpoint is required after merge and exact Production deployment of this remediation.

## Rollback-readiness boundary

Rollback readiness is a manual Step 6B review item. This foundation records it as pending only.

## Next phase

Version 25 Step 6B — Production execution and human verification.
