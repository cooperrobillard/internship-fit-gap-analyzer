# Dev 20 Limited-Public-Beta Launch Readiness

**Status:** RELEASE CANDIDATE — PENDING HUMAN PRODUCTION VERIFICATION

**Checkpoint date:** June 22, 2026

This record tracks the Dev 20 limited-public-beta launch candidate for **Job Fit & Skill-Gap Analyzer**. It does not declare the final production launch verdict.

## Scope summary — Dev 20 Step 1A–1E

- Step 1A: application shell and shared navigation/footer moved toward the Dev 20 design system.
- Step 1B: landing page repositioned around current hosted product capabilities, rule-based matching, and privacy-aware CTAs.
- Step 1C: dashboard hierarchy organized around Analyze, Saved analyses, and Resume profiles.
- Step 1D: dashboard component polish improved responsive layout, focus-compatible controls, readable states, and export/profile/detail/comparison presentation.
- Step 1E: privacy page redesign, sign-in/sign-up product context, README reconciliation, hosted smoke-test modernization, and this launch-readiness record.

## Release-candidate PR

- PR: `TBD — ui: prepare Dev 20 limited-public-beta launch candidate`
- Merge status: pending human review; do not merge automatically.

## Eventual production commit

- Production commit: `TBD after merge`
- Production deployment URL/version: `TBD after Vercel production deploy`

## Automated checks required

Run before release-candidate review and again as appropriate before merge:

```bash
python3 tests/test_api_service.py
python3 run_tests.py
python3 -m py_compile api/main.py api/models.py tests/test_api_service.py run_tests.py streamlit_app.py
cd web && npm run lint && npm run build && cd ..
git diff --check
```

Required privacy/tracked-file checks:

```bash
git ls-files web/.env.local
git ls-files .env
git ls-files .env.local
git ls-files data/outputs/analysis_results.db
git ls-files data/resume/resume.txt
git ls-files data/jobs
git ls-files | grep DS_Store || true
git status --short | grep ".env" || true
```

## Preview verification required

Human review must verify the Vercel preview before merge:

- `/` landing page.
- `/privacy` page.
- `/sign-in` route.
- `/sign-up` route.
- `/dashboard` signed-out protection and signed-in dashboard.
- Analysis flow with **Try sample inputs** and **Run analysis (does not save)**.
- **Save structured results**, saved list, detail, search/filter, comparison, recurring gaps, export/download, delete, and structured profile workflows.
- Header, footer, route metadata, active navigation, no duplicate page shell, no horizontal scrolling, and no stale prototype scaffolding.
- Signed-in and signed-out states.

## Production verification required

After human merge and production deployment, run the hosted smoke test in [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md), including:

- Render `/health` check.
- Vercel production route review.
- Clerk sign-in/sign-out checks using test accounts.
- Synthetic analysis and save/read/delete checks.
- Two-user saved-analysis and resume-profile isolation checks.
- Safe `413` and safe `429` behavior spot checks.
- Launch-copy review.
- Screenshot evidence capture.

## Screenshot evidence checklist

Preview screenshots to capture:

- [ ] Landing page at desktop width.
- [ ] Privacy page at desktop width.
- [ ] Sign-in route at mobile width.
- [ ] Sign-up route at mobile width.
- [ ] Dashboard signed-in overview.
- [ ] Analysis result.
- [ ] Saved-analysis detail.
- [ ] Comparison view.
- [ ] Resume profiles at mobile width.

Production screenshots to capture after merge:

- [ ] Landing page at desktop width.
- [ ] Privacy page at desktop width.
- [ ] Sign-in route at mobile width.
- [ ] Sign-up route at mobile width.
- [ ] Dashboard signed-in overview.
- [ ] Analysis result.
- [ ] Saved-analysis detail.
- [ ] Comparison view.
- [ ] Resume profiles at mobile width.

## Accessibility checkpoint

Manual review must include:

- Skip link.
- Visible focus.
- Keyboard-only critical workflow.
- Logical heading hierarchy.
- Labels and helper text for app-owned forms.
- Loading/status/error announcement placement.
- Local table overflow only.
- 200% zoom.
- 400% reflow spot-check.

Do not claim formal WCAG certification from this checkpoint.

## Launch-copy checkpoint

Verify copy remains accurate:

- Public product name: **Job Fit & Skill-Gap Analyzer**.
- Limited public beta/portfolio software positioning.
- Rule-based, not AI.
- No hiring, employment, ranking, or fit guarantees.
- No absolute privacy/security claims.
- Current feature list is accurate.
- Current limitations are visible.
- No stale prototype/test/developer copy appears on public routes or release docs.

## Dev 19 evidence inherited

Dev 20 inherits, but does not replace, these Dev 19 records:

- [`DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md`](DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md)
- [`DEV19_RLS_AUTH_REVERIFICATION.md`](DEV19_RLS_AUTH_REVERIFICATION.md)
- [`DEV19_ABUSE_RATE_LIMIT_REVIEW.md`](DEV19_ABUSE_RATE_LIMIT_REVIEW.md)

Dev 19 evidence includes point-in-time two-user RLS verification and abuse/rate-limit review. Any future schema, helper, auth-provider, data-control, or persistence change requires re-verification.

## Accepted limited-beta constraints

- Rule-based matching only.
- No AI or semantic judgment.
- No PDF/DOCX parsing.
- No formal security audit or penetration test.
- No formal legal privacy-policy review.
- No account-wide export.
- No one-click delete-all.
- No automated retention.
- No restore or undo.
- No automatic Clerk-account-to-Supabase cleanup guarantee.
- Platform/service logging cannot be guaranteed absent.
- Limited public beta/portfolio software, not mature production SaaS.

## Launch blockers

Record any blocker before final verdict:

- Cross-user data exposure.
- Broken auth boundary.
- Broken analysis flow.
- Broken save/read/delete or structured-profile workflow.
- Unsafe error display with secrets, tokens, stack traces, SQL/provider internals, or private raw text.
- Inaccurate public privacy/security claim.
- Production route unavailable after deploy.
- Required checks failing without an accepted non-blocking explanation.

Current blocker status: `TBD — pending human preview and production verification`.

## Final verdict

**Pending.** The final verdict must remain pending until a human completes Vercel preview review, merges the candidate, runs the production smoke test, captures screenshot evidence, verifies the deployed production environment, and updates this record.

Allowed final verdict values after production verification:

- `READY FOR LIMITED PUBLIC BETA`
- `READY WITH ACCEPTED NON-BLOCKING LIMITATIONS`
- `NOT READY — BLOCKED`

## How to update after production verification

1. Replace the PR placeholder with the actual PR number/link.
2. Replace the production commit placeholder with the deployed commit SHA.
3. Record the production verification date and tester.
4. Link or list screenshot evidence filenames.
5. Summarize automated check results.
6. Summarize preview and production smoke-test results.
7. List accepted non-blocking limitations or blockers.
8. Set exactly one final verdict value from the allowed list.
