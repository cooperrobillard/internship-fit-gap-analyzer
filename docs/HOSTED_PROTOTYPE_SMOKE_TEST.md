# Hosted Smoke Test — Limited Public Beta Candidate

Run this checklist before merging a release candidate and again after production deployment. Use generic sample text only; never use private resumes, private job descriptions, user identifiers, tokens, row IDs, or secrets.

Related: [`DEV20_LIMITED_PUBLIC_BETA_LAUNCH_READINESS.md`](DEV20_LIMITED_PUBLIC_BETA_LAUNCH_READINESS.md), [`DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md`](DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md), [`DEV19_RLS_AUTH_REVERIFICATION.md`](DEV19_RLS_AUTH_REVERIFICATION.md), [`DEV19_ABUSE_RATE_LIMIT_REVIEW.md`](DEV19_ABUSE_RATE_LIMIT_REVIEW.md), [`web/README.md`](../web/README.md).

The final limited-public-beta status cannot be selected until production verification is complete.

## Version 23 saved-analysis data-control release checks

Historical record: the June 29, 2026 production Playwright end-to-end QA run passed against production commit `5a6293eb3103cf2b73eb7c60fad5524b2bd4aee2` on `internship-fit-gap-analyzer.vercel.app`. See [`VERSION_23_DATA_CONTROL_QA.md`](VERSION_23_DATA_CONTROL_QA.md). That historical PASS does not make the reusable checklist below permanently complete for future deployments.

For each future deployment, re-run the relevant release checks with synthetic data only:

- [ ] First saved-analysis page loads ten records where enough records exist.
- [ ] **Load more analyses** appends the next page.
- [ ] Partial final page is handled correctly.
- [ ] No-more state appears after the final page.
- [ ] Incremental load-more error preserves existing rows and retry can recover.
- [ ] Search/filter operate across currently loaded pages.
- [ ] Row checkbox controls remain independent from detail-opening controls.
- [ ] **Select all visible** checks only currently visible loaded rows.
- [ ] Select-all state can become indeterminate.
- [ ] Hidden selected count appears when checked rows are hidden by search/filter.
- [ ] Selected CSV includes checked loaded rows and excludes unchecked rows.
- [ ] Loaded CSV includes loaded rows without claiming account-wide export.
- [ ] Selected-delete cancel path leaves records unchanged.
- [ ] Selected-delete success path removes only selected loaded records.
- [ ] Already-unavailable selected target is reconciled safely.
- [ ] Complete deletion failure leaves failed records selected.
- [ ] Partial deletion failure reports the partial result and keeps failed records selected.
- [ ] Individual deletion regression still works.
- [ ] Loaded-depth preservation remains after refresh or deletion.
- [ ] Two-user RLS isolation prevents cross-account saved-analysis visibility and actions.
- [ ] Clerk session reset does not leak prior-user state.
- [ ] Keyboard behavior covers selection, details, exports, loading more, and deletion confirmation.
- [ ] Responsive behavior remains usable at the release target sizes.
- [ ] Synthetic-data cleanup removes current-run synthetic records.

## 1. Pre-flight repo checks

```bash
git branch --show-current
git status
git pull origin main
git ls-files web/.env.local
git ls-files .env
git ls-files .env.local
git ls-files data/outputs/analysis_results.db
git ls-files data/resume/resume.txt
git ls-files data/jobs
git ls-files | grep DS_Store || true
git status --short | grep ".env" || true
```

- [ ] On `main` or the agreed release branch.
- [ ] Working tree contains only intended release-candidate changes.
- [ ] No environment files, private data files, generated database files, or `.DS_Store` files are tracked.

## 2. Automated local checks

```bash
python3 tests/test_api_service.py
python3 run_tests.py
python3 -m py_compile api/main.py api/models.py tests/test_api_service.py run_tests.py streamlit_app.py
cd web && npm ci && npm run lint && npm run build && cd ..
git diff --check
```

- [ ] API service tests pass.
- [ ] Full Python test suite passes.
- [ ] Python compile succeeds.
- [ ] Web install, lint, and build succeed.
- [ ] Diff whitespace check succeeds.

## 3. Hosted backend check

```bash
curl -s https://internship-fit-gap-analyzer.onrender.com/health
```

- [ ] Response includes `{"status":"ok"}`.
- [ ] If Render is waking from sleep, wait about 30 seconds and retry once.

## 4. Cross-route visual QA

Review both Vercel preview and production after merge for:

| Route | Signed out | Signed in |
|---|---|---|
| `/` | Landing page, sign-in/sign-up CTAs, privacy link | Auth-aware dashboard/privacy CTAs |
| `/privacy` | Public privacy/data-control content | Same public content, dashboard CTA works |
| `/sign-in` | Product context plus Clerk form | Redirect/Clerk behavior remains expected |
| `/sign-up` | Product context plus Clerk form | Redirect/Clerk behavior remains expected |
| `/dashboard` | Requires sign-in | Workspace loads |

Check each route for:

- [ ] Header and footer visible and coherent.
- [ ] Route metadata/title is accurate.
- [ ] Active navigation is accurate where present.
- [ ] No duplicate page shell or nested main layout issue is visible.
- [ ] No horizontal page scrolling.
- [ ] Launch copy says limited public beta/release candidate where appropriate.
- [ ] No stale prototype scaffolding or developer/test language.

## 5. Responsive review

Manually review at:

- [ ] 320 px
- [ ] 375 px
- [ ] 390 px
- [ ] 768 px
- [ ] 1024 px
- [ ] 1280 px and wider

Confirm Clerk forms, dashboard tables, exports, comparison selectors, saved lists, profile controls, privacy sections, header, and footer remain usable. Tables may use local overflow; the full page should not horizontally scroll.

## 6. Accessibility checkpoint

Manual checks are required; Lighthouse accessibility can support but must not replace keyboard and layout review.

- [ ] Skip link works.
- [ ] Focus is visible on links, buttons, fields, Clerk controls, and dashboard controls.
- [ ] Keyboard-only critical workflow: sign in, open dashboard, run analysis, save structured results, open detail, search/filter, compare, export, delete, and manage profiles where test data allows.
- [ ] Logical heading hierarchy on landing, privacy, sign-in, sign-up, and dashboard.
- [ ] Form labels and helper text are present for app-owned fields.
- [ ] Loading, status, and error messages are announced or placed near triggering controls.
- [ ] Local table overflow only; no page-wide horizontal overflow.
- [ ] 200% zoom remains readable.
- [ ] 400% reflow spot-check does not hide critical content.
- [ ] Do not claim formal WCAG certification.

## 7. Hosted analysis workflow

On `/dashboard`, use safe sample text only.

Use the built-in fictional sample for:

- Role: **Supply Chain Operations Analyst Intern**
- Company: **Northstar Distribution**
- Candidate: **Demo Candidate**

Expected matched canonical skills exactly:

```text
excel
inventory management
logistics
procurement
```

Expected missing canonical skills exactly:

```text
demand planning
erp
forecasting
sap erp
supplier management
```

- [ ] Click **Try sample inputs** and confirm synthetic inputs load into fields only.
- [ ] Confirm loading the sample does not automatically run analysis.
- [ ] Confirm loading the sample does not automatically save a record.
- [ ] Click **Run analysis (does not save)**.
- [ ] Matched and missing skills render with counts and lists.
- [ ] Matched skills are exactly `excel`, `inventory management`, `logistics`, and `procurement`.
- [ ] Missing skills are exactly `demand planning`, `erp`, `forecasting`, `sap erp`, and `supplier management`.
- [ ] No skill appears in both matched and missing lists.
- [ ] No raw stack trace, secret, token, SQL error, or provider body appears in the UI.
- [ ] If Render was asleep, a calm retry message appears; retry once after the service wakes.
- [ ] Transient `.txt` upload analysis works with synthetic text and does not automatically create a saved file or profile.
- [ ] Saved structured-profile analysis works when an explicitly selected profile is used as the resume-side input.

## 8. Supabase save/read and dashboard workflows

Signed in as User A with synthetic data:

- [ ] Click **Save structured results**.
- [ ] Success message appears without raw error codes.
- [ ] Saved list refreshes and shows metadata/counts only.
- [ ] Detail view opens and shows structured fields only.
- [ ] Search/filter finds the synthetic row.
- [ ] Comparison can use User A saved rows only.
- [ ] Recurring-gap statistics update where enough saved rows exist.
- [ ] Export/download works where currently supported.
- [ ] Individual delete removes the synthetic saved analysis after confirmation.
- [ ] Reload `/dashboard`; remaining data still belongs to User A only.

## 9. RLS / two-user isolation check

Use synthetic data only.

### Saved analyses

- [ ] User A can create and read their own saved analysis.
- [ ] User A search/filter and comparison options show only User A rows.
- [ ] Sign out.
- [ ] Sign in as User B.
- [ ] User B does not see User A rows in list, search/filter, detail options, comparison options, exports, or recurring-gap views.
- [ ] User B runs analysis and clicks **Save structured results**.
- [ ] User B sees only their own row(s) and can delete only their own rows where controls are available.

### Resume profiles

- [ ] User B can create, edit, read, select, and delete their own structured profile.
- [ ] User B does not see User A structured profiles.
- [ ] Sign back in as User A.
- [ ] User A does not see User B saved analyses or structured profiles.
- [ ] Synthetic verification rows/profiles are cleaned up.

## 10. Failure-state and abuse-control spot checks

Do not run load or stress testing.

- [ ] Empty saved list shows a calm empty state.
- [ ] Save/read errors show short safe copy.
- [ ] Analysis errors show calm copy with no stack traces.
- [ ] No pasted resume/job body text appears in saved list rows.
- [ ] Authenticated access remains required for `/api/analyze`.
- [ ] Oversized proxy request produces safe `413 Payload Too Large` behavior with public copy only.
- [ ] Controlled rate-limit verification produces safe `429` handling without displaying WAF/provider response bodies directly.
- [ ] Resume input, job input, selected structured profile, and optional metadata remain preserved after `429`.
- [ ] Local cooldown prevents immediate repeated submission and does not automatically rerun analysis.
- [ ] Normal analysis resumes after the rate-limit window expires.

## 11. Launch-copy review

Check public copy on `/`, `/privacy`, `/sign-in`, `/sign-up`, `/dashboard`, `README.md`, and `web/README.md` for:

- [ ] Public name consistency: **Job Fit & Skill-Gap Analyzer**.
- [ ] Limited-public-beta positioning.
- [ ] Copy describes a curated cross-domain taxonomy and reviewed aliases.
- [ ] Copy says the system is broad but not exhaustive and does not infer unstated skills.
- [ ] Copy says phrase detection does not prove proficiency, evidence strength, or hiring fit.
- [ ] Rule-based/not-AI accuracy.
- [ ] No hiring, employment, ranking, or fit guarantees.
- [ ] No absolute privacy/security claims.
- [ ] Current feature accuracy: saved analyses, profiles, detail, search/filter, comparison, recurring gaps, exports, individual deletion, safe loading/error/rate-limit handling.
- [ ] Current limitation accuracy: no account-wide export, no delete-all, no automated retention, no restore, no profile export, no automatic account-deletion cleanup guarantee, no formal audit/legal review.
- [ ] No stale developer/test language.

## 12. Screenshot evidence

Do not commit binary screenshots unless a human requests them. Capture and attach to the release record or PR/release notes.

Recommended preview filenames:

- `preview-landing-1280.png`
- `preview-privacy-1280.png`
- `preview-sign-in-390.png`
- `preview-sign-up-390.png`
- `preview-dashboard-signed-in-1280.png`
- `preview-dashboard-analysis-result-1280.png`
- `preview-dashboard-saved-detail-1280.png`
- `preview-dashboard-comparison-768.png`
- `preview-dashboard-profiles-390.png`

Recommended production filenames after merge:

- `prod-landing-1280.png`
- `prod-privacy-1280.png`
- `prod-sign-in-390.png`
- `prod-sign-up-390.png`
- `prod-dashboard-signed-in-1280.png`
- `prod-dashboard-analysis-result-1280.png`
- `prod-dashboard-saved-detail-1280.png`
- `prod-dashboard-comparison-768.png`
- `prod-dashboard-profiles-390.png`

## 13. Final decision rubric

The final status cannot be selected until production verification is complete.

### READY FOR LIMITED PUBLIC BETA

All automated checks, preview visual/accessibility checks, production smoke tests, RLS/isolation checks, privacy checks, screenshot evidence, and launch-copy review pass with no blocking findings.

### READY WITH ACCEPTED NON-BLOCKING LIMITATIONS

All critical safety, privacy, auth, data-isolation, and workflow checks pass, and remaining issues are documented as accepted limited-beta constraints that do not mislead users or risk data exposure.

### NOT READY — BLOCKED

Any critical workflow failure, cross-user data exposure, secret/token/private text leak, broken auth boundary, unsafe error display, inaccurate launch/privacy claim, or unresolved production deploy failure blocks launch.


## Version 23 Step 3 selected deletion checks

- [ ] Verify **Delete selected** is disabled with no selection.
- [ ] Verify confirmation opens without deletion when **Delete selected** is pressed.
- [ ] Verify **Cancel** preserves selection and data.
- [ ] Verify confirmation includes selected records hidden by search/filter.
- [ ] Verify successful selected deletion removes only checked loaded snapshot targets.
- [ ] Verify failed targets remain selected.
- [ ] Verify active detail and Compare selections clear only for removed records.
- [ ] Verify Insights/list refresh once after a completed selected deletion with deleted or unavailable targets.
- [ ] Verify no **Delete all** or account-wide wording appears.
- [ ] Clean up any synthetic saved-analysis data used for verification.

## Version 23 Step 4 — saved-analysis load-more smoke checks

Use synthetic saved analyses only, then clean them up after testing.

- Confirm the saved-analysis panel initially loads 10 records when the account has more than 10 saved analyses.
- Confirm **Load more analyses** appends the next page while keeping current rows visible.
- Confirm a partial final page appends correctly when fewer than 10 records remain.
- Confirm the no-more state appears after the final page and no account-wide claim is shown.
- Simulate or observe a load-more failure and confirm current rows, selection, detail, Compare, notices, and filters are preserved with an inline retryable error.
- Search after more pages load and confirm matches can appear from any currently loaded page only.
- Select rows across multiple loaded pages and confirm checked counts and hidden-by-filter counts stay accurate.
- Export selected CSV across pages and confirm only checked loaded rows are included.
- Export loaded CSV across pages and confirm all currently loaded rows are included regardless of search/filter/selection.
- Delete selected rows across pages and confirm the confirmation snapshot, partial-failure behavior, and safe notices are preserved.
- After individual or selected deletion, confirm refresh preserves the previously loaded depth rather than collapsing to 10.
- Switch Clerk sessions and confirm the new session loads only its first page and stale prior-session pages do not append.
- Delete synthetic saved analyses created for this test.

## Current Production target and canonical metadata checks

Canonical Production base URL: https://jobfit.cooperrobillard.com

- [ ] `/` has the correct canonical.
- [ ] `/privacy` has the correct canonical.
- [ ] Old Vercel-host HTML points canonically to the custom host.
- [ ] Open Graph title, description, URL, and image are present.
- [ ] Twitter card, title, description, and image are present.
- [ ] `/sitemap.xml` contains only `/` and `/privacy`.
- [ ] `/robots.txt` references the canonical sitemap.
- [ ] Robots disallow dashboard, API, sign-in, sign-up, and Clerk infrastructure paths.
- [ ] Dashboard, sign-in, and sign-up output no-index metadata.
- [ ] Share-image URLs return HTTP 200 with an image content type.
- [ ] No metadata advertises AI, semantic matching, formal certification, legal compliance, or mature SaaS readiness.
