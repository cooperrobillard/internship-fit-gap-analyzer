# Version 25 Step 1 custom-domain plan

## 1. Title

Version 25 Step 1 — custom-domain target, dependency inventory, verification plan, and rollback plan for the Job Fit & Skill-Gap Analyzer.

## 2. Status

**Status: planning complete for documentation-only review.** This step selects and documents the production custom-domain target, records the verified DNS facts supplied for this task, inventories hostname-dependent systems, and defines the human-controlled configuration, verification, and rollback order. It does not change DNS, Vercel, Clerk, Render, FastAPI CORS, Sentry, UptimeRobot, Supabase, environment variables, application behavior, metadata implementation, QA behavior, portfolio links, databases, schema, RLS, dependencies, workflows, deployments, or provider settings.

Remote verification is externally blocked in this Codex workspace because `git fetch --prune origin` cannot reach GitHub and the GitHub CLI is unavailable. This limitation is not treated as a passed remote check; the plan is based on the verified local checkout at Version 24 closure commit `70c0f85701df4d75abad323c64cfbf6e19685cc4`.

## 3. Objective

Choose and document the approved production frontend hostname and create the complete human-controlled configuration, verification, and rollback plan for a later custom-domain migration. The migration must preserve the existing production architecture:

```text
Browser
→ Vercel Next.js frontend
→ same-origin POST /api/analyze
→ existing Render FastAPI backend
→ deterministic Python analyzer
```

## 4. Selected domain

The selected production frontend hostname is:

```text
jobfit.cooperrobillard.com
```

The planned canonical public URL after the later migration is complete is:

```text
https://jobfit.cooperrobillard.com
```

## 5. Domain-option comparison

| Option | Assessment | Decision |
| --- | --- | --- |
| `jobfit.cooperrobillard.com` | Immediately understandable, aligned with the product, broader than an internship-only name, suitable for internships, co-ops, and jobs, product-specific without affecting the portfolio root, available under an already-owned domain, and easier to remove or replace than a portfolio-root migration. | **Recommended and selected.** |
| `app.cooperrobillard.com` | Short, but too generic. It does not communicate the Job Fit & Skill-Gap Analyzer product and could conflict with future portfolio applications. | Rejected. |
| `skills.cooperrobillard.com` | Related to the feature set, but less product-specific than `jobfit` and could imply a broader skills portfolio or training site. | Rejected. |
| `analyzer.cooperrobillard.com` | Descriptive, but more technical and less clean as a public-facing product URL than `jobfit`. | Rejected. |
| Separately purchased standalone domain | Could support future brand separation, but is higher-risk now because it adds purchase, renewal, ownership, trust, and brand-commitment overhead before product feedback justifies it. | Rejected for Version 25. |

The choice is resolved: use `jobfit.cooperrobillard.com`.

## 6. Selection rationale

`jobfit.cooperrobillard.com` is the best target because it is understandable, product-aligned, broader than internships, appropriate for internships, co-ops, and jobs, and product-specific without moving or disrupting `cooperrobillard.com`. It also uses an already-owned domain, avoids buying a separate brand domain too early, is easier to remove or replace than a portfolio-root migration, is less generic than `app`, more product-specific than `skills`, and cleaner than `analyzer`.

## 7. Current production hostnames

Current production-facing hostnames and roles:

- Existing Vercel frontend hostname: `https://internship-fit-gap-analyzer.vercel.app`.
- Existing Render backend health hostname: `https://internship-fit-gap-analyzer.onrender.com/health`.
- Existing Render backend service hostname: `https://internship-fit-gap-analyzer.onrender.com`.
- Existing portfolio root: `cooperrobillard.com`, which remains the portfolio and must not be moved, redirected, or disrupted.

Historical evidence documents that name the host used when the tests occurred should not be rewritten merely because the later canonical hostname changes.

## 8. Canonical-host decision

After migration verification, the canonical public URL will be:

```text
https://jobfit.cooperrobillard.com
```

The default Vercel URL may remain reachable as a deployment and rollback access path, but current public references and canonical metadata should identify only the custom host after verification.

## 9. Default Vercel-host strategy

The existing Vercel hostname should remain connected, continue serving the production deployment, remain available for deployment inspection and rollback, and not initially redirect. It should be treated as noncanonical, not advertised as the public URL after migration, and not promised as a fully interchangeable Clerk-authenticated production domain.

Preserving a Vercel deployment alias is not, by itself, a complete authentication fallback. A complete rollback may also require restoring the prior Clerk production-domain configuration and prior Vercel environment/deployment configuration. The default Vercel hostname alone is not a complete authentication fallback unless the prior Clerk configuration has also been restored.

Do not add Clerk satellite or multi-domain architecture merely to preserve authentication on the Vercel alias.

## 10. Frontend-only custom-domain decision

The custom domain is frontend-only. The intended production architecture is:

```text
https://jobfit.cooperrobillard.com
        │
        ▼
Vercel — Next.js frontend and /api/analyze proxy
        │
        ▼
https://internship-fit-gap-analyzer.onrender.com
        │
        ▼
FastAPI deterministic analyzer
```

Keep `https://internship-fit-gap-analyzer.onrender.com` as the backend hostname. Do not add a Render custom backend hostname.

## 11. DNS ownership and authoritative-provider facts

Use these verified sanitized DNS facts for Step 1 planning:

- Registrar: Porkbun LLC.
- Authoritative DNS provider: Porkbun DNS.
- Authoritative nameservers:
  - `curitiba.ns.porkbun.com`
  - `fortaleza.ns.porkbun.com`
  - `maceio.ns.porkbun.com`
  - `salvador.ns.porkbun.com`
- Registry expiration: `2027-03-20T03:47:42Z`.

The initial WHOIS connection reported a timeout but still returned registrar, expiration, and nameserver information. That timeout does not invalidate the independently returned DNS information, but the human operator should recheck current provider state before executing DNS or certificate work.

Do not document WHOIS registrant contact details, street addresses, phone numbers, personal email addresses, account IDs, credentials, tokens, secret values, recovery codes, private dashboard URLs, or screenshots containing private provider data.

## 12. Existing `jobfit` record status

No DNS answer was returned for `jobfit.cooperrobillard.com`. Treat the hostname as currently unused unless the Porkbun dashboard shows otherwise at execution time.

The later Step 2 DNS procedure must require the human operator to:

1. Confirm the correct Vercel project.
2. Add `jobfit.cooperrobillard.com` in the Vercel project’s production Domains settings.
3. Copy the exact provider-generated record displayed by Vercel.
4. Add only that exact record in Porkbun DNS.
5. Avoid changing root-domain or portfolio records.
6. Avoid changing unrelated Porkbun records.
7. Reconfirm public CAA state before waiting for certificate issuance.
8. Wait for Vercel ownership verification and TLS readiness.
9. Confirm the hostname is assigned to Production.
10. Preserve the default Vercel hostname.
11. Avoid redirects during this stage.
12. Record only sanitized DNS results.

Do not guess the Vercel CNAME target. Do not copy a target from a tutorial, previous project, remembered provider default, or unofficial source.

## 13. CAA and certificate considerations

No CAA records were returned by the public dig query at inspection time. Reconfirm CAA immediately before certificate-related provider work because DNS state can change.

Vercel and Clerk certificate behavior, DNS record requirements, dashboard wording, and plan entitlements are provider-managed and changeable. Human configuration must use the exact values displayed by each provider at execution time.

## 14. Public TTL and propagation considerations

Relevant public TTL information supplied for this plan:

- Public SOA minimum/negative caching value: `1800` seconds.
- SOA refresh: `10000` seconds.
- SOA retry: `2400` seconds.
- SOA expire: `604800` seconds.
- No record-specific TTL exists yet for `jobfit` because no record was returned.

During Step 2, distinguish negative-cache propagation, DNS ownership verification, certificate issuance, and deployment assignment. Record sanitized public DNS results only.

## 15. Vercel inventory

Repository inspection shows the Next.js frontend lives under `web/`, production QA uses configurable `QA_BASE_URL`, and the analysis path is proxied through `web/src/app/api/analyze/route.ts`. The later Vercel work should be limited to adding the approved custom frontend hostname to the correct production project, preserving the default Vercel hostname, avoiding redirects during the first domain attachment stage, and confirming that the custom hostname is assigned to Production.

No deployment configuration, environment variable, redirect, metadata, or application behavior change is part of Step 1.

## 16. Clerk inventory

Clerk is the highest-risk hostname dependency because production domains, generated DNS records, publishable keys, redirect URLs, cookies, sessions, account portal behavior, OAuth callbacks, and Supabase JWT issuer assumptions can all be hostname-sensitive.

Step 3 must review and reconcile:

- Clerk production domain;
- application-domain classification;
- Clerk-generated DNS records;
- certificate status;
- production publishable key;
- Vercel production environment configuration;
- redeployment requirements;
- sign-in URLs;
- sign-up URLs;
- fallback URLs;
- redirect behavior;
- allowed subdomains;
- `authorizedParties`;
- cookie and session behavior;
- account portal behavior;
- OAuth callback URLs if social login is enabled;
- Clerk/Supabase JWT issuer behavior;
- behavior on the old Vercel hostname.

Starting recommendation:

```text
Clerk application classification:
Product-scoped Secondary application
```

The operator must confirm this against the exact current Clerk dashboard language before applying it. This recommendation is not permission to configure the old Vercel hostname as a satellite application.

## 17. Clerk publishable-key and redeployment risk

A Clerk production-domain change may generate a different production publishable key. The later migration must not be considered complete until the Vercel production environment and deployed production build are reconciled and authentication is tested on the custom hostname.

Do not copy actual publishable-key values into documentation. Refer to the dashboard role or environment variable name only.

## 18. Clerk `authorizedParties` inventory

A later code/configuration step should explicitly review and restrict authorized production application origins. The expected production application origin is:

```text
https://jobfit.cooperrobillard.com
```

Local development must remain usable through an explicit development-safe configuration. Do not weaken production host validation, permit arbitrary forwarding hosts, or add broad wildcard origins.

## 19. Clerk origin, redirect, cookie, account-portal, and OAuth inventory

Step 3 must test and document sign-in, sign-up, fallback, after-auth redirect behavior, account portal behavior, cookie and session scope, OAuth callback URLs if social login is enabled, and Clerk/Supabase JWT issuer behavior. Clerk treats the Vercel and custom hostnames as different root domains, so existing sessions on the old hostname may not seamlessly authenticate the new hostname.

## 20. Explicit old-host authentication limitation

The default Vercel hostname is preserved for deployment inspection and rollback access, but it must not be described as a guaranteed authenticated second production domain. If authentication fails on the old Vercel hostname after the Clerk migration, that can be expected unless the prior Clerk configuration has also been restored or a consciously designed multi-domain architecture has been implemented later.

## 21. Next.js metadata inventory

Repository inspection found `web/src/app/layout.tsx` as the current app layout and metadata location. Step 1 does not implement metadata.

A later narrow Step 4 should review and implement only necessary current-public-reference and canonical metadata changes, potentially including:

```text
metadataBase
alternates.canonical
openGraph
twitter
sitemap.ts
robots.ts
```

Use one canonical URL source where practical. The final canonical host should be `https://jobfit.cooperrobillard.com`. The default Vercel URL may remain technically reachable, but canonical metadata should identify only the custom host after migration verification.

## 22. FastAPI and CORS inventory

The current architecture is same-origin for browser analysis requests:

```text
Browser
→ Next.js /api/analyze
→ server-to-server Render request
```

Repository inspection of `web/src/app/api/analyze/route.ts` shows the browser analysis path is a Next.js route that forwards server-to-server to the configured backend. Repository inspection of `api/main.py` shows FastAPI CORS is configured from `ALLOWED_ORIGINS` with local development defaults.

No production CORS change is expected solely because the frontend hostname changes, because the browser talks to the same-origin Next.js route rather than calling Render directly. A later Step 5 should record an explicit “no change required” outcome when supported by final inspection.

Do not add `*`, do not add the custom frontend hostname without evidence it is needed, do not remove local development origins without evidence, do not change Render only because the frontend hostname changed, and do not expose the shared secret. If repository inspection ever discovers direct browser-to-Render requests, stop and reassess before changing CORS.

## 23. Sentry inventory

No Sentry SDK, DSN, browser-monitoring, replay, tracing, profiling, or source-map change is planned for the custom-domain migration.

Preserve the existing boundaries:

- server-only telemetry;
- route templates instead of full URLs;
- no query strings;
- sanitized approved failure events;
- environment and release tagging;
- no browser monitoring;
- no replay;
- no tracing;
- no profiling;
- no source-map upload.

Later manual inventory should check alert filters for the old hostname, saved dashboard searches containing the old hostname, environment naming, release naming, provider-generated host metadata, and continued absence of issues for successful analyses.

## 24. UptimeRobot transition plan

Use overlapping frontend monitoring during the transition.

```text
Existing frontend monitor:
https://internship-fit-gap-analyzer.vercel.app

Temporary transition monitor:
https://jobfit.cooperrobillard.com

Unchanged backend monitor:
https://internship-fit-gap-analyzer.onrender.com/health
```

Required transition behavior:

- keep the existing Vercel-host monitor during the migration;
- create the custom-host monitor only after DNS and TLS are ready;
- leave the Render `/health` monitor unchanged;
- observe both frontend hosts during transition;
- distinguish DNS/certificate failures from deployment failures;
- make the custom-host monitor permanent only after stable verification;
- retain the old-host monitor during the rollback window when monitor capacity permits;
- retire it only after the final rollback window is complete;
- do not intentionally break production to test DOWN alerts.

Version 24 already verified bounded notification behavior. Use provider test features or nonproduction methods instead of creating a real outage.

## 25. Supabase and RLS inventory

No Supabase structural change is expected. Do not change the Supabase project URL, schema, migrations, tables, policies, RLS, keys, or browser/service-role boundaries.

Later verification must include Clerk session token integration, saved-analysis create/read/delete behavior, structured résumé-profile CRUD, two-user ownership isolation, confirmation that no service-role key is used in browser code, and confirmation that no RLS policy changed.

## 26. Privacy and documentation inventory

Preserve all existing privacy invariants:

- no raw résumé persistence;
- no raw job-description persistence;
- no uploaded-file persistence;
- no service-role key in browser code;
- no RLS changes;
- no database changes;
- no unrestricted telemetry;
- no provider credentials in documentation.

Plan later updates for current public references in appropriate files, potentially including the root README, web README, deployment documentation, smoke-test documentation, privacy-page links, support or sharing copy, and current QA defaults where appropriate. Do not rewrite historical verification evidence merely because it contains the hostname used at the time.

A custom domain does not create legal compliance, security certification, formal audit status, penetration-test status, guaranteed uptime, mature SaaS readiness, or semantic or AI-based analysis.

## 27. Portfolio inventory

`cooperrobillard.com` remains the existing portfolio and must not be moved, redirected, or disrupted. Defer all portfolio changes to Version 25 Step 7.

Later inventory may include project-card destination, case-study demo link, Open Graph destination, résumé/application links, GitHub project link, and public launch announcement. Do not publish the custom URL from the portfolio until the complete production smoke test passes.

## 28. QA and hardcoded-host inventory

Current production QA accepts configurable `QA_BASE_URL`; the Render health URL remains independently configurable. Later QA inspection should cover:

- `web/.env.qa.example`;
- Playwright configuration;
- authentication smoke configuration;
- Version 23 production E2E coverage;
- smoke-test documentation;
- screenshots and generated reports;
- hardcoded old-host assertions;
- Clerk testing configuration;
- deployment-resolution helpers.

Do not commit real QA credentials or production mutation confirmations.

## 29. Exact Configuration order

1. **Step 1 — Planning and dependency inventory only**
   - Select and document the hostname.
   - Record DNS ownership facts.
   - Inventory dependencies.
   - Define verification and rollback.
   - Make no provider changes.
2. **Step 2 — Vercel domain and Porkbun DNS**
   - Add the approved hostname to the correct Vercel project.
   - Obtain the exact provider-generated DNS record.
   - Add only that record at Porkbun.
   - Wait for ownership verification and TLS.
   - Confirm assignment to Production.
   - Preserve the default Vercel alias.
   - Do not change Clerk yet.
3. **Step 3 — Clerk reconciliation**
   - Reconcile the Clerk production domain.
   - Confirm application classification.
   - Add exact Clerk-generated DNS records if required.
   - Reconcile certificates.
   - Reconcile the production publishable key.
   - Update the Vercel production environment where required.
   - Redeploy.
   - Review redirects, allowed subdomains, `authorizedParties`, cookies, sessions, account portal, OAuth callbacks, JWT behavior, and old-host expectations.
4. **Step 4 — Canonical metadata and current public references**
   - Implement only necessary canonical metadata.
   - Add Open Graph/social metadata where appropriate.
   - Add sitemap/robots where appropriate.
   - Update current public URL, privacy, README, and QA references.
   - Preserve historical evidence.
5. **Step 5 — Provider and integration reconciliation**
   - Reconcile FastAPI/CORS assumptions.
   - Review Vercel and Render environments.
   - Review Sentry filters.
   - Start UptimeRobot overlap.
   - Verify Supabase behavior.
   - Review Preview behavior and provider allowlists.
   - Record explicit “no change required” outcomes.
6. **Step 6 — Complete production verification**
   - Run public-host smoke testing.
   - Run authentication and dashboard testing.
   - Run analysis and fallback testing.
   - Verify request correlation.
   - Verify monitoring.
   - Verify Supabase CRUD and RLS isolation.
   - Verify structured data.
   - Verify responsive behavior.
   - Verify fallback-host and rollback assumptions.
   - Use fictional content only.
7. **Step 7 — Portfolio, launch, and closure**
   - Update portfolio and permanent public links.
   - Finalize launch documentation.
   - Close Version 25.
   - Pause major development for real-user feedback.

## 30. Exact Verification order

1. DNS resolution.
2. Vercel ownership verification.
3. TLS certificate readiness.
4. Production deployment assignment.
5. Public homepage response.
6. Clerk sign-in and sign-up.
7. Existing-session expectations.
8. Protected dashboard access.
9. Account portal behavior.
10. OAuth callback behavior if applicable.
11. Supabase token integration.
12. Saved-analysis CRUD.
13. Structured résumé-profile CRUD.
14. Two-user RLS isolation.
15. Same-origin `/api/analyze`.
16. Backend health.
17. Deterministic analysis behavior.
18. Error and fallback behavior.
19. Sentry privacy boundaries.
20. UptimeRobot overlap.
21. Metadata and canonical URL.
22. Sitemap and robots behavior if implemented.
23. Responsive/mobile behavior.
24. Default Vercel-host behavior.
25. Rollback readiness.
26. Portfolio publication only after all production checks pass.

## 31. Exact Rollback order

1. Declare rollback and stop public-link promotion or additional configuration.
2. Confirm the default Vercel alias serves the known-good deployment.
3. Restore the prior Clerk production-domain configuration.
4. Restore the prior Vercel environment/deployment configuration without exposing keys.
5. Verify old-host sign-in, session, dashboard, and Supabase access.
6. Revert canonical metadata and current public-URL changes if deployed.
7. Return the permanent frontend monitor to the verified working host.
8. Remove any Vercel custom-host redirect.
9. Detach the custom domain only after the old path is verified.
10. Remove or restore the new `jobfit` DNS record last.
11. Revert portfolio or public-launch links if already published.
12. Continue monitoring until DNS caches and certificates settle.

The default Vercel hostname alone is not a complete authentication fallback unless the prior Clerk configuration has also been restored.

## 32. Secret-handling rules

Do not document or commit Clerk secret keys, actual publishable-key values, Supabase secrets, service-role keys, shared API secrets, Sentry DSNs, Vercel tokens, Porkbun credentials, account IDs, recovery codes, private WHOIS data, OAuth client secrets, or production QA credentials.

Provider values should be referenced by variable or dashboard role, not copied into documentation.

## 33. Human-only actions

Human-only actions include DNS edits, Vercel domain attachment, Vercel redirects, Clerk configuration, Clerk key reconciliation, environment variable edits, Render changes, FastAPI CORS production changes, Sentry provider changes, UptimeRobot monitor changes, Supabase changes, schema or RLS changes, production QA mutation confirmation, deployment approval, portfolio publication, and public launch decisions.

Provider behavior is current and changeable. This plan was prepared using official provider documentation reviewed June 30, 2026, America/New_York, plus the sanitized DNS facts supplied for this task. Because this Codex environment cannot perform online provider-documentation research, human configuration steps must recheck current official provider documentation and use the exact values displayed by each provider at execution time.

Do not guess exact Vercel DNS targets, Clerk-generated DNS records, current dashboard labels, plan entitlements, account-specific values, or provider defaults.

## 34. Later code and documentation actions

Later Version 25 steps may update current public references, canonical metadata, QA defaults, deployment docs, README files, privacy-page links, smoke-test docs, and provider-inventory docs after the custom domain is verified. Those steps must preserve historical evidence, privacy invariants, and rollback readiness.

## 35. Known limitations

This plan does not change runtime behavior, perform provider configuration, prove production readiness, run a formal security audit, complete legal compliance, guarantee uptime, add AI or semantic matching, add PDF/DOCX parsing, add application tracking, or make the default Vercel hostname a fully authenticated second production domain.

Remote GitHub verification, branch push, PR creation, and GitHub check monitoring are externally blocked in this workspace and must be completed from a GitHub-connected environment.

## 36. Complete Version 25 roadmap

- Step 1: planning and dependency inventory only.
- Step 2: Vercel domain and Porkbun DNS.
- Step 3: Clerk reconciliation.
- Step 4: canonical metadata and current public references.
- Step 5: provider and integration reconciliation.
- Step 6: complete production verification.
- Step 7: portfolio, launch, and closure.

Version 25 must not claim mature SaaS readiness or security-audited status unless a later explicitly approved task performs and documents that work.

## 37. Definition of done

Version 25 Step 1 is done when the local documentation plan explicitly selects `jobfit.cooperrobillard.com`, documents the Porkbun registrar and authoritative DNS facts, records the lack of a public `jobfit` answer and CAA answer at inspection time, documents the SOA minimum/negative caching value of 1800 seconds, inventories Vercel, Clerk, `authorizedParties`, Next.js metadata, FastAPI/CORS, Sentry, UptimeRobot, Supabase/RLS, privacy, portfolio, and QA, defines exact configuration, verification, and rollback order, changes only this plan and `LEARNING_LOG.md`, runs and records available checks, prepares a PR body if GitHub access is blocked, and makes no DNS, provider, runtime, environment, database, RLS, portfolio, or deployment change.

## 38. Exact next step

> **Version 25 Step 2 — add `jobfit.cooperrobillard.com` to the correct Vercel production project, obtain the exact provider-generated DNS record, add only that record at the verified Porkbun authoritative DNS provider, verify ownership and TLS, preserve the default Vercel hostname, and document the sanitized results without changing Clerk yet.**
