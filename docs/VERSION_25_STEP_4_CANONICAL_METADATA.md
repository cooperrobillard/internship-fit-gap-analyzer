# Version 25 Step 4 — Canonical Production metadata

## 1. Title and status

Status: implemented in this PR; post-merge Production verification remains pending.

## 2. Objective

Make `https://jobfit.cooperrobillard.com` the canonical public URL in current application metadata and operational documentation while preserving historical evidence that used `internship-fit-gap-analyzer.vercel.app`.

## 3. Starting state

Version 25 Steps 1–3 completed custom-domain configuration and Clerk Production migration. The owner reported private-browser Production preflight success before this implementation.

## 4. Canonical URL decision

The fixed canonical origin is `https://jobfit.cooperrobillard.com`. Preview, localhost, and the old Vercel alias are noncanonical.

## 5. Metadata architecture

Next.js App Router metadata uses one shared site configuration, a root `metadataBase`, route-level canonical URLs for indexable pages, and explicit no-index metadata for app routes.

## 6. Shared site configuration

`web/src/lib/site-config.ts` exports the fixed origin, URL object, product name, description, locale, and absolute URL helper. It does not use request hosts, Vercel environment variables, localhost fallbacks, wildcards, or secrets.

## 7. Homepage canonical

The homepage declares `/` as canonical with an absolute title of `Job Fit & Skill-Gap Analyzer`.

## 8. Privacy-page canonical

The privacy page keeps its existing title and description and declares `/privacy` as canonical.

## 9. Open Graph metadata

Root and page metadata define restrained website Open Graph data for the current public product.

## 10. Twitter metadata

Root and page metadata define summary-large-image Twitter card data without social usernames or verification tokens.

## 11. Generated social images

Open Graph and Twitter image routes render a 1200 × 630 PNG with static product copy. The renderer uses system-safe typography, no remote assets, no user content, and no provider logos.

## 12. Sitemap policy

`/sitemap.xml` includes exactly the canonical homepage and privacy page. Application, API, Clerk, Preview, localhost, and old-host URLs are excluded.

## 13. Robots policy

`/robots.txt` allows public pages, disallows `/dashboard`, `/api/`, `/sign-in`, `/sign-up`, and `/__clerk/`, and points to the canonical sitemap and host.

## 14. Non-indexable application routes

Sign-in, sign-up, and dashboard metadata are marked no-index, no-follow, and no-cache where page metadata applies.

## 15. Old-host canonical behavior

The old Vercel alias may remain reachable for deployment inspection and rollback, but generated canonical metadata points to the custom hostname.

## 16. Current-reference documentation updates

Current README, web README, deployment guide, smoke-test guide, QA example, Version 23 QA README, roadmap, and learning log now identify the custom hostname for current public references.

## 17. Historical-evidence preservation

Historical Version 23–25 documents that accurately record old-host QA, monitoring, migration, rollback, or authentication behavior were not globally rewritten.

## 18. QA configuration update

`web/.env.qa.example` now defaults `QA_BASE_URL` to the canonical hostname and leaves `QA_EXPECTED_COMMIT` blank for each run.

## 19. Systems explicitly unchanged

No DNS, Vercel provider settings, Clerk configuration, Clerk authorized parties, Supabase, schema, RLS, Render, FastAPI, CORS, Sentry, UptimeRobot, workflows, dependencies, or portfolio site changed.

## 20. Privacy and claims boundaries

No raw résumé or job-description persistence was added. Metadata and social images contain no user data, secrets, AI claim, semantic-matching claim, mature-SaaS claim, legal-compliance claim, security-certification claim, or guaranteed-uptime claim.

## 21. Verification commands

Implementation-time validation should include focused TypeScript tests, lint, typecheck, build, Python regressions, diff checks, allowed-file checks, unsafe canonical-logic searches, intended metadata searches, forbidden-claims searches, historical-host review, current-host review, sensitive-file checks, and secret scans. Post-merge hosted verification must re-check the deployed metadata routes and tags.

## 22. Rollback procedure

Revert this PR to remove the canonical metadata/routes and documentation updates. Provider configurations are unchanged, so rollback does not require DNS, Clerk, Supabase, Render, or Vercel setting changes.

## 23. Known limitations

This step implements code and documentation only. It does not verify post-merge deployed HTML, complete provider reconciliation, complete final Production verification, or publish portfolio links.

## 24. Definition of done

Done means the application has fixed canonical metadata for indexable pages, no-index metadata for application routes, generated social images, sitemap and robots routes, focused tests, reconciled current public references, and preserved historical old-host evidence.

## 25. Exact next step

Version 25 Step 5 — reconcile remaining provider and integration assumptions for the canonical custom hostname, explicitly review FastAPI/CORS, Vercel and Render environments, Sentry filters, UptimeRobot overlap, Supabase behavior, Preview behavior, and provider allowlists, then record required changes and explicit no-change outcomes.
