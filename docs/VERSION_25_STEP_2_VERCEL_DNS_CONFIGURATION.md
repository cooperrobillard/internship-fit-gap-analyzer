# Version 25 Step 2 — Vercel DNS configuration

## 1. Status

**Complete as a documentation-only follow-up.** The human owner completed the Vercel custom-domain attachment, Porkbun DNS CNAME configuration, public DNS verification, Vercel ownership verification, TLS verification, private-browser landing-page check, fallback-host verification, and rollback posture review for `jobfit.cooperrobillard.com` on June 30, 2026 at 22:48:06 America/New_York.

This document records only the verified sanitized facts supplied for this step. Codex did not access private provider dashboards, change DNS, change Vercel settings, change Porkbun settings, deploy, or perform provider actions.

## 2. Objective

Document that `jobfit.cooperrobillard.com` is attached to the existing Vercel production project for the Job Fit & Skill-Gap Analyzer, with Porkbun DNS resolving to the exact Vercel-provided CNAME target, Vercel reporting a valid production configuration, HTTPS and certificate checks passing, the default Vercel hostname preserved, and Clerk deliberately deferred to Version 25 Step 3.

## 3. Scope

In scope:

- Vercel project/domain verification facts supplied by the human owner.
- Porkbun DNS record details for the `jobfit` host.
- Authoritative and independent public DNS verification results.
- Vercel ownership, configuration, and Production assignment status.
- HTTPS, certificate, and private-browser landing-page verification results.
- Existing Vercel hostname preservation and non-redirect status.
- Rollback posture for removing the custom-host path if needed.
- Explicit boundaries for Clerk, metadata, public links, providers, application code, privacy, and persistence.

Out of scope:

- Changing Clerk.
- Verifying authenticated behavior on the custom hostname.
- Updating canonical metadata.
- Updating portfolio links, README links, QA defaults, or launch material.
- Changing Render, FastAPI/CORS, Sentry, UptimeRobot, Supabase, schema, RLS, application code, environment variables, or provider settings.

## 4. Official-provider research note

The human procedure was checked against official provider documentation reviewed June 30, 2026, America/New_York:

- Vercel — Adding & Configuring a Custom Domain.
- Vercel — Deploying & Redirecting Domains.
- Vercel — Working with SSL Certificates.
- Vercel — Troubleshooting Domains.
- Porkbun — How to Add DNS Records on Porkbun.
- Porkbun — How to Edit DNS Records.
- Porkbun — How Long Will It Take for Changes to DNS to Show Up?

Codex did not access private Vercel, Porkbun, Clerk, Supabase, Render, Sentry, or UptimeRobot dashboards. Provider interfaces, labels, requirements, and wording may change. Future provider actions must use the exact values displayed by the provider at execution time, not values guessed from documentation or prior screenshots.

## 5. Starting production state

Version 25 Step 1 was merged in PR #47 at expected commit `3857fccc75e8505bced4a4c15603cf82de60c2da`. Step 1 selected `jobfit.cooperrobillard.com` as the production frontend hostname and deliberately deferred Clerk to Version 25 Step 3.

The Vercel project reported for Step 2 is `internship-fit-gap-analyzer`, connected to repository `cooperrobillard/internship-fit-gap-analyzer`, with production branch `main`, framework `Next.js`, and root directory `web`. Vercel displayed production deployment commit `3857fcc`.

## 6. Human-controlled actions completed

The human owner completed these provider actions outside the repository:

1. Added `jobfit.cooperrobillard.com` to the existing Vercel production project.
2. Added only the exact Vercel-provided `jobfit` CNAME record in Porkbun DNS.
3. Used the verified CNAME target `6baf70c9e185a618.vercel-dns-017.com.`.
4. Set the Porkbun TTL to 600 seconds.
5. Verified public DNS through the four authoritative Porkbun nameservers.
6. Verified public DNS through Cloudflare `1.1.1.1` and Google `8.8.8.8`.
7. Verified Vercel ownership and final domain status.
8. Verified TLS and browser loading behavior.
9. Verified the existing Vercel hostname remains attached to Production and is not redirected.

No provider action was performed by Codex.

## 7. Vercel project verification

Verified Vercel facts:

- Project: `internship-fit-gap-analyzer`.
- Connected repository: `cooperrobillard/internship-fit-gap-analyzer`.
- Production branch: `main`.
- Production deployment commit displayed by Vercel: `3857fcc`.
- Framework: `Next.js`.
- Root directory: `web`.
- Custom hostname: `jobfit.cooperrobillard.com`.

## 8. Selected hostname

The selected production frontend hostname is:

```text
jobfit.cooperrobillard.com
```

No root domain assignment was added. No `www.jobfit` hostname was added.

## 9. DNS provider

The authoritative DNS provider remains Porkbun DNS. No nameserver migration occurred.

Verified authoritative nameservers:

- `curitiba.ns.porkbun.com`
- `fortaleza.ns.porkbun.com`
- `maceio.ns.porkbun.com`
- `salvador.ns.porkbun.com`

The portfolio root and unrelated Porkbun DNS records were not changed.

## 10. DNS record added

Only this exact Vercel-provided Porkbun DNS record was added:

| Field | Value |
| --- | --- |
| Type | `CNAME` |
| Porkbun host | `jobfit` |
| Public Vercel CNAME target | `6baf70c9e185a618.vercel-dns-017.com.` |

No additional Vercel ownership TXT record was requested.

## 11. TTL

The Porkbun TTL is 600 seconds.

## 12. Public DNS verification

Public DNS verification passed. All authoritative and independent resolver checks returned:

```text
6baf70c9e185a618.vercel-dns-017.com.
```

## 13. Authoritative nameserver verification

All four authoritative Porkbun nameservers returned the expected CNAME target:

- `curitiba.ns.porkbun.com` returned `6baf70c9e185a618.vercel-dns-017.com.`.
- `fortaleza.ns.porkbun.com` returned `6baf70c9e185a618.vercel-dns-017.com.`.
- `maceio.ns.porkbun.com` returned `6baf70c9e185a618.vercel-dns-017.com.`.
- `salvador.ns.porkbun.com` returned `6baf70c9e185a618.vercel-dns-017.com.`.

## 14. Independent resolver verification

Independent resolver verification passed:

- Cloudflare `1.1.1.1` returned `6baf70c9e185a618.vercel-dns-017.com.`.
- Google `8.8.8.8` returned `6baf70c9e185a618.vercel-dns-017.com.`.

## 15. Vercel ownership and configuration verification

Vercel final domain status is:

```text
Valid Configuration
```

No additional ownership TXT record was requested.

## 16. Production assignment verification

The custom domain is assigned to Production. The attached Production hostname is `jobfit.cooperrobillard.com`.

## 17. TLS verification

HTTPS verification passed for the custom hostname.

Verified custom-host result:

```text
HTTP 200
```

Verified SSL result:

```text
0
```

Verified final URL:

```text
https://jobfit.cooperrobillard.com/
```

## 18. Certificate details

Verified certificate facts:

- Issuer: Let's Encrypt, `CN=YR1`.
- Valid from: `Jul 1 01:46:02 2026 GMT`.
- Valid to: `Sep 29 01:46:01 2026 GMT`.
- Certificate SAN includes `jobfit.cooperrobillard.com`: yes.

## 19. Custom-host HTTP verification

The custom hostname returned HTTP 200 at:

```text
https://jobfit.cooperrobillard.com/
```

This confirms the public landing page responded over HTTPS for the custom host. It does not verify authenticated flows, account behavior, Clerk callback behavior, Supabase JWT behavior, or protected-dashboard access.

## 20. Private-browser verification

Private-browser landing-page verification passed.

Verified private-browser result:

- correct Job Fit Analyzer landing page loaded;
- expected styling appeared;
- no DNS error;
- no Vercel 404;
- no certificate warning;
- no unexpected redirect.

## 21. Existing Vercel-host preservation

The existing Vercel hostname remains connected:

```text
internship-fit-gap-analyzer.vercel.app
```

Verified existing-host facts:

- HTTP result: `HTTP 200`.
- Final URL: `https://internship-fit-gap-analyzer.vercel.app/`.
- Existing Vercel hostname redirected: no.
- Existing Vercel hostname remains attached to Production: yes.

## 22. Redirect status

No redirect was configured from the old Vercel hostname to the custom hostname. No root-domain redirect was configured. No `www.jobfit` redirect was configured.

## 23. Clerk deferral and known authentication limitation

**Clerk was intentionally not changed in Version 25 Step 2.**

This document does not claim that sign-in, sign-up, account portal behavior, session persistence, cookies, OAuth callbacks, `authorizedParties`, Supabase JWT behavior, or protected-dashboard access have been verified on `jobfit.cooperrobillard.com`.

Those behaviors remain:

```text
Deferred to Version 25 Step 3 — Clerk production-domain reconciliation.
```

The custom hostname is not yet declared the final fully operational authenticated public hostname. Existing sessions and authentication behavior across the Vercel and custom root domains are not guaranteed. No public portfolio or README promotion should occur yet.

## 24. Systems explicitly unchanged

Version 25 Step 2 did not change:

- Clerk;
- Clerk keys;
- Clerk DNS records;
- Vercel environment variables;
- Vercel redirects;
- the old Vercel hostname;
- Render;
- FastAPI/CORS;
- Sentry;
- UptimeRobot;
- Supabase;
- schema;
- RLS;
- application code;
- canonical metadata;
- QA configuration;
- portfolio links;
- public README links;
- nameservers;
- root DNS records;
- unrelated Porkbun records.

## 25. Privacy and secret-handling confirmation

A custom domain does not change the application privacy or persistence model.

This Step 2 documentation does not include Vercel tokens, Vercel account IDs, Vercel team IDs, private dashboard URLs, Porkbun credentials, registrar account IDs, Clerk keys, Supabase keys, Sentry DSNs, Render shared secrets, environment values, cookies, recovery codes, private WHOIS data, screenshots containing account information, raw résumé text, or raw job-description text.

The public CNAME target, public hostname, TTL, and public certificate details are safe to document.

## 26. Step 2 rollback procedure

If the custom-domain attachment needs to be rolled back before later Version 25 steps:

1. Stop promoting or using `jobfit.cooperrobillard.com` as a public product URL.
2. Confirm `https://internship-fit-gap-analyzer.vercel.app/` still returns HTTP 200 and serves the intended Production deployment.
3. Do not assume authenticated fallback behavior is complete unless the prior Clerk configuration is also verified or restored in the later Clerk step.
4. Remove any custom-host public references created outside this step, if any exist.
5. In Vercel, detach `jobfit.cooperrobillard.com` only after the old host is verified.
6. In Porkbun, remove or restore only the `jobfit` CNAME record last.
7. Continue monitoring until DNS caches and certificate behavior settle.

No rollback action was needed or performed in this documentation task.

## 27. Known limitations

Known limitations after Step 2:

- The custom hostname is not yet the final fully operational authenticated public hostname.
- Clerk production-domain reconciliation remains required in Version 25 Step 3.
- Sign-in, sign-up, account portal, session persistence, cookies, OAuth callbacks, `authorizedParties`, Supabase JWT behavior, and protected-dashboard access are not verified on the custom hostname in this step.
- Existing sessions and authentication behavior across `internship-fit-gap-analyzer.vercel.app` and `jobfit.cooperrobillard.com` are not guaranteed.
- No public portfolio or README promotion should occur yet.
- No metadata or canonical URL update occurred.
- No UptimeRobot target change occurred.
- No mature SaaS, formal security audit, legal compliance, guaranteed uptime, or launch-complete claim is made.

## 28. Definition of done

Version 25 Step 2 is done when:

- `jobfit.cooperrobillard.com` is documented as attached to the existing Vercel production project.
- The connected repository, production branch, framework, root directory, and deployment commit are recorded.
- Porkbun is documented as the authoritative DNS provider.
- The exact `jobfit` CNAME target and 600-second TTL are recorded.
- Public DNS verification through all four authoritative Porkbun nameservers is recorded.
- Public DNS verification through Cloudflare `1.1.1.1` and Google `8.8.8.8` is recorded.
- Vercel `Valid Configuration` and Production assignment are recorded.
- HTTPS, SSL verification result `0`, certificate issuer, validity dates, and SAN coverage are recorded.
- Private-browser landing-page verification is recorded.
- The existing Vercel hostname preservation and non-redirect status are recorded.
- Clerk deferral and authentication limitations are prominent.
- The unchanged systems, privacy boundary, rollback procedure, known limitations, and exact next step are recorded.
- Only this document and `LEARNING_LOG.md` are changed.

## 29. Exact next step

> **Version 25 Step 3 — reconcile Clerk’s production-domain configuration for `jobfit.cooperrobillard.com`, add only the exact Clerk-generated DNS records when required, reconcile the production publishable key and Vercel production environment, redeploy safely, review sign-in/sign-up URLs, redirects, cookies, sessions, account portal behavior, OAuth callbacks, `authorizedParties`, Supabase JWT integration, and old-host expectations, then verify authentication without weakening security.**
