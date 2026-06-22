# Dev 19 Step 4 — Abuse and Rate-Limit Review

**Status:** Complete — production activation and verification passed.

**Verification date:** June 22, 2026 at 12:41 PM ET

Related: [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md), [`PUBLIC_PRODUCT_ROADMAP.md`](PUBLIC_PRODUCT_ROADMAP.md), [`DEV19_RLS_AUTH_REVERIFICATION.md`](DEV19_RLS_AUTH_REVERIFICATION.md), [`DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md`](DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md).

## Scope

This record documents the bounded public-beta abuse posture for the hosted analysis flow. It records application behavior plus the human-activated Vercel WAF/rate-limit rule. It does not add provider settings, infrastructure, dependencies, secrets, account quotas, bot prevention, or a distributed abuse-prevention system.

## Active production rule

The human verified the following Vercel WAF/rate-limit rule is active:

```text
Path: POST /api/analyze
Strategy: Fixed Window
Window: 60 seconds
Limit: 20 requests
Counting key: IP
Action: 429
```

| Check | Result |
|---|---:|
| Vercel WAF rate-limit rule active | PASS |
| Rule applies to `POST /api/analyze` | PASS |
| Fixed window, 20 requests per 60 seconds, counted by IP | PASS |

## Application controls and verified behavior

| Check | Result |
|---|---:|
| Normal authenticated analysis succeeds | PASS |
| Oversized proxy request returns safe `413` | PASS |
| Controlled burst returns `429` | PASS |
| Provider response body is not rendered directly | PASS |
| Inputs remain preserved after `429` | PASS |
| Local cooldown works | PASS |
| Normal analysis resumes after cooldown | PASS |
| No tokens, IP addresses, raw input, stack traces, or provider internals appeared | PASS |

The current application posture includes Clerk authentication on the Next.js analysis route, server-side forwarding to Render with a server-only shared secret, backend character limits, a proxy request-body ceiling, sanitized validation/error responses, frontend retry/cooldown handling, and no application save-path persistence of raw resume or job-description text.

## Limitations and non-goals

- This is basic public-beta abuse protection, not comprehensive DDoS or abuse prevention.
- The active limiter is IP-based; it is not an account quota system and may have shared-IP false positives.
- It is not bot prevention and does not stop distributed abuse from many IPs or accounts.
- It does not regulate direct Supabase usage beyond existing RLS and application behavior.
- It is not a formal security audit, penetration test, or legal/privacy compliance sign-off.
- The request-size control is an application/proxy safeguard; platform infrastructure may handle very large requests before application code runs.
- No Supabase schema, RLS policies, Clerk configuration, Render configuration, workflows, dependencies, environment variables, or deployment code were changed by this documentation checkpoint.

## Conclusion

Dev 19 Step 4 passed for its bounded scope. The hosted analysis route now has verified basic IP-based WAF rate limiting, safe oversized-request handling, safe `429` behavior, input preservation, local cooldown recovery, and no observed private or technical leakage during the human production check.
