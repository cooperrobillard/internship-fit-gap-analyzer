# Version 25 Step 3 — Clerk Production migration closeout

## 1. Status and objective

**Status: complete for documentation-only closeout.** This document records the sanitized results of the completed Clerk Development-to-Production activation for the Job Fit & Skill-Gap Analyzer.

The objective of Step 3 was to move the hosted custom-domain application authentication boundary from Clerk Development configuration to Clerk Production configuration for:

```text
jobfit.cooperrobillard.com
```

The local documentation closeout timestamp is `2026-07-01 15:25:07 EDT` in America/New_York.

## 2. Scope and out-of-scope boundaries

In scope:

- documenting the completed Clerk Production migration;
- recording sanitized DNS, certificate, Supabase, Vercel, authentication, session, CRUD, RLS, Playwright QA, old-host, and rollback results;
- marking Version 25 Step 3 complete in project documentation.

Out of scope for this PR:

- application code, tests, dependencies, runtime configuration, environment files, Clerk settings, Vercel settings, Supabase settings, DNS, RLS, deployment changes, or provider dashboard changes;
- exposing provider secrets, tokens, cookies, OAuth secrets, QA-user email addresses, user IDs, row IDs, screenshots, traces, private report files, private dashboard URLs, or local report contents;
- claiming a formal security audit, legal compliance review, guaranteed uptime, or mature SaaS readiness.

All provider actions described here were performed manually by the human owner outside Codex. Codex only records the sanitized completion facts supplied for this closeout.

## 3. Starting state

- Migration path: Development-to-Production activation.
- Clerk application classification: Secondary application.
- Production application domain: `jobfit.cooperrobillard.com`.
- Development users/data: disposable.
- Step 3A guardrail PR: `#49`.
- Verified deployed commit: `540b2876b8b11f267bb02418f167c5eeeecfc855`.

## 4. Human-controlled provider actions completed

The human owner completed the provider-side migration work outside the repository:

1. Activated the Clerk Production instance for the secondary application.
2. Configured Clerk Production authentication and application paths.
3. Added and verified Clerk-generated DNS records.
4. Confirmed Clerk certificate deployment.
5. Reconciled Supabase Third-Party Auth for Clerk Production while retaining Development support for Preview/local use.
6. Split Vercel Production and Preview Clerk environment key classes.
7. Redeployed the `main` production deployment.
8. Performed production authentication, session, CRUD, structured-profile, RLS, and Playwright QA verification.

No provider action was performed by Codex.

## 5. Clerk Production configuration

Verified Clerk Production authentication configuration:

- Email/password enabled.
- Email verification code enabled.
- Google OAuth configured with Production credentials.
- Webhooks: none / not applicable.
- Sign-in application path: `/sign-in`.
- Sign-up application path: `/sign-up`.
- Sign-in fallback: `/dashboard`.
- Sign-up fallback: `/dashboard`.
- OAuth consent/account portal behavior remains Clerk-managed.

No OAuth client secrets, Clerk secret-key values, JWTs, cookies, session tokens, QA identities, or dashboard-private URLs are documented here.

## 6. Clerk DNS and certificate verification

Clerk DNS verification result: **PASS**.

Verified Clerk DNS records:

| Type | Host | Target |
| --- | --- | --- |
| CNAME | `clerk.jobfit` | `frontend-api.clerk.services` |
| CNAME | `accounts.jobfit` | `accounts.clerk.services` |
| CNAME | `clkmail.jobfit` | `mail.2z1ugxfxwj57.clerk.services` |
| CNAME | `clk._domainkey.jobfit` | `dkim1.2z1ugxfxwj57.clerk.services` |
| CNAME | `clk2._domainkey.jobfit` | `dkim2.2z1ugxfxwj57.clerk.services` |

Existing application DNS record preserved:

| Host | Target |
| --- | --- |
| `jobfit` | `6baf70c9e185a618.vercel-dns-017.com.` |

Clerk certificate deployment result: **PASS / active**.

## 7. Allowed Subdomains

- Allowed Subdomains: enabled.
- Additional entries: none.
- Satellite configuration: none.

The default Vercel hostname was not converted into a second authenticated public domain, and no Clerk satellite configuration was added.

## 8. Supabase integration and unchanged RLS

Clerk Production Supabase integration result:

- Clerk Production Supabase integration: enabled.
- Supabase Third-Party Auth trusts the Production Clerk issuer.
- Supabase Third-Party Auth retains the Development Clerk issuer for Preview/local support.
- `role=authenticated` configured.
- RLS changed: no.
- Service-role key added to frontend: no.

The migration did not weaken RLS, disable RLS, bypass user ownership checks, or add service-role credentials to browser/client code.

## 9. Vercel environment separation and redeployment

Verified Vercel environment split:

| Environment | Publishable key class | Secret key class | Scope |
| --- | --- | --- | --- |
| Production | `pk_live` | `sk_live` | Production only |
| Preview | `pk_test` | `sk_test` | Preview only |
| Local Development | retained | retained | local development |

Verified Vercel Clerk path variables:

```text
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

Additional Vercel path facts:

- Paths are relative.
- No `FORCE_REDIRECT` variables.
- No satellite variables.

Verified redeployment:

- Branch: `main`.
- Commit: `540b2876b8b11f267bb02418f167c5eeeecfc855`.
- Environment: Production.
- Status: Ready.

## 10. Production authentication/session verification

Production verification results:

| Check | Result |
| --- | --- |
| Signed-out landing | PASS |
| Protected dashboard redirect | PASS |
| Production sign-up | PASS |
| Email verification | PASS |
| Google OAuth sign-in | PASS |
| Sign-in | PASS |
| Dashboard authorization | PASS |
| Refresh persistence | PASS |
| Second-tab session | PASS |
| Browser-reopen persistence | PASS |
| Redirect loop | no |
| UserButton | PASS |
| Account management | PASS |
| Return-to-app host | PASS |
| Sign-out | PASS |

## 11. Analysis, CRUD, profile, and two-user RLS verification

Verified application behavior after migration:

| Check | Result |
| --- | --- |
| Analysis | PASS |
| Raw résumé/job persistence changed | no |
| Saved-analysis create/read/delete | PASS |
| Structured profile create/read/use/delete | PASS |
| Two-user RLS isolation | PASS |
| RLS changed during testing | no |

The product remains structured-results and structured-profile oriented. This migration did not add raw résumé storage, raw job-description storage, PDF/DOCX parsing, AI extraction, semantic matching, or application tracking.

## 12. Automated Playwright QA result

Automated Production QA used the Version 23 Playwright production suite.

Sanitized result summary:

- 17 tests passed.
- Two Production QA identities verified as distinct.
- Authentication and two-user RLS isolation passed.
- Structured save/detail passed.
- Pagination passed.
- Failure/retry handling passed.
- Search and filtering passed.
- Selection and CSV flows passed.
- Keyboard accessibility passed.
- Responsive checks passed.
- Deletion paths passed.
- Current-run synthetic-data cleanup completed.

QA-user email addresses, secrets, storage state, local reports, screenshots, traces, and private report contents are intentionally not documented.

## 13. Old-host behavior and why it is acceptable

Old Vercel hostname verification results:

- Landing/application shell loads.
- Protected dashboard redirects to the old hostname's `/sign-in` route.
- Clerk sign-in form does not render on the old hostname.
- Authentication therefore fails closed.
- No protected dashboard or user data is exposed.
- No session bypass was observed.
- No Clerk satellite configuration was added.
- No change is required because the old hostname is a deployment/rollback route, not a second public authenticated domain.

Old-host example protected redirect:

```text
https://internship-fit-gap-analyzer.vercel.app/sign-in?redirect_url=https%3A%2F%2Finternship-fit-gap-analyzer.vercel.app%2Fdashboard
```

This behavior is acceptable because the old Vercel hostname remains useful as a deployment and rollback route while failing closed for authenticated use.

## 14. Privacy and secret-handling confirmation

This closeout records only sanitized public or class-level facts:

- Clerk key classes only: `pk_live`, `sk_live`, `pk_test`, and `sk_test`.
- No actual Clerk key values.
- No Supabase secrets or service-role credentials.
- No Vercel tokens.
- No OAuth client secrets.
- No cookies, session tokens, JWTs, storage state, or user identifiers.
- No QA-user email addresses.
- No row IDs.
- No screenshots, traces, local report files, private dashboard URLs, or private report contents.
- No local absolute filesystem paths.

## 15. Rollback procedure/readiness

Rollback readiness result: **PASS**.

Rollback posture:

- Development Clerk keys remain available.
- Preview/local Development configuration remains intact.
- Existing Vercel hostname remains available as an unauthenticated deployment route.
- Existing application CNAME remains intact.
- Production Clerk instance remains intact during investigation.
- No ownership IDs would be rewritten manually.
- RLS would not be weakened.

If rollback is needed, the human owner should investigate using provider dashboards and sanitized logs, preserve RLS and ownership boundaries, and avoid manual identity rewrites. Any production provider changes remain human-controlled deployment work, not Codex-controlled repository work.

## 16. Known limitations

- This is a documentation-only closeout, not a formal security audit.
- This is not a legal/privacy compliance certification.
- This does not guarantee uptime or mature SaaS readiness.
- The old Vercel hostname is not a second authenticated production domain.
- Clerk account portal and OAuth consent behavior remain Clerk-managed.
- Future provider UI labels or requirements may change.
- Unrelated Version 25 work, including canonical metadata/public-link updates and broader launch polish, remains separately scoped.

## 17. Definition of done

Version 25 Step 3 is done when:

- Clerk Production is active for `jobfit.cooperrobillard.com`.
- Clerk DNS and certificate checks pass.
- Production and Preview Vercel Clerk key classes are separated.
- Production deployment at commit `540b2876b8b11f267bb02418f167c5eeeecfc855` is Ready.
- Production sign-up, sign-in, email verification, Google OAuth, session persistence, account management, and sign-out pass.
- Analysis, saved-analysis CRUD, structured-profile flows, and two-user RLS isolation pass.
- Automated Production QA passes with sanitized results.
- Old-host behavior fails closed for authentication.
- Rollback posture is documented.
- No secrets or private QA identifiers are documented.

All criteria above are recorded as complete based on the human-supplied sanitized verification facts.

## 18. Final sanitized results sheet

| Area | Sanitized result |
| --- | --- |
| Migration path | Development-to-Production activation |
| Clerk application classification | Secondary application |
| Production application domain | `jobfit.cooperrobillard.com` |
| Development users/data | Disposable |
| Step 3A guardrail PR | `#49` |
| Verified deployed commit | `540b2876b8b11f267bb02418f167c5eeeecfc855` |
| Clerk Production auth | Email/password, email verification code, and Google OAuth enabled |
| Clerk webhooks | none / not applicable |
| Clerk sign-in path | `/sign-in` |
| Clerk sign-up path | `/sign-up` |
| Clerk fallbacks | `/dashboard` |
| Clerk DNS | PASS |
| Clerk certificate | PASS / active |
| Allowed Subdomains | enabled; no additional entries |
| Satellite configuration | none |
| Supabase Production Clerk issuer | trusted |
| Supabase Development Clerk issuer | retained for Preview/local support |
| Supabase role | `authenticated` |
| RLS changed | no |
| Frontend service-role key | no |
| Production key classes | `pk_live` / `sk_live` |
| Preview key classes | `pk_test` / `sk_test` |
| Vercel deployment | `main`, Production, Ready |
| Production authentication/session checks | PASS, with no redirect loop |
| Analysis and CRUD checks | PASS |
| Structured profile checks | PASS |
| Two-user RLS isolation | PASS |
| Automated Production QA | 17 tests passed |
| Synthetic-data cleanup | completed |
| Old-host authenticated behavior | fails closed; no protected data exposed |
| Rollback readiness | PASS |
| Raw résumé/job persistence changed | no |
