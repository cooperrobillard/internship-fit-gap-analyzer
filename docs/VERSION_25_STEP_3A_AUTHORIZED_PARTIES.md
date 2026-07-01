# Version 25 Step 3A: Clerk authorized parties guardrail

## Purpose

This step adds a narrow Clerk `authorizedParties` guardrail before the human owner reconciles Clerk's production domain configuration. The code now makes the application fail closed to a small set of exact origins instead of accepting arbitrary request-derived hosts.

Deploying this guardrail before provider changes reduces rollout risk: the app can be verified with the custom production hostname and the preserved default Vercel hostname before the Clerk production-domain reconciliation changes are made outside the repository.

## Allowed origins

Production-safe environments authorize exactly:

- `https://jobfit.cooperrobillard.com`
- `https://internship-fit-gap-analyzer.vercel.app`

Local development authorizes exactly:

- `http://localhost:3000`
- `http://127.0.0.1:3000`

Every environment other than explicit `development` uses the production-safe list, including `production`, `test`, unset, preview, staging, or any nonstandard value.

## Preview authentication limitation

Preview deployments are intentionally not given wildcard authorization. Because there is no `*.vercel.app` or request-host-derived authorization, arbitrary preview URLs should not be expected to authenticate with Clerk through this guardrail.

## Rollout and rollback note

The existing default Vercel hostname remains authorized only to preserve rollout and rollback access during the domain transition. This is not intended to provide broad multi-domain session support or to introduce satellite-domain behavior.

## Boundaries

This step did not change provider settings, environment variables, DNS, Vercel configuration, Clerk dashboard configuration, Supabase, RLS, Render, Sentry, UptimeRobot, metadata, public links, sign-in pages, sign-up pages, or deployment settings.

No wildcard origins, satellite-domain configuration, Clerk proxy configuration, or debug logging were added.

## Next phase

The exact next phase is human Clerk production-domain reconciliation in the Clerk dashboard/provider configuration. That work must remain a human-owned configuration change and is not performed by this code PR.
