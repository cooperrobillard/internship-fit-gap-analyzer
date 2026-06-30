# Version 24 Step 3B — production provider configuration and verification

**Status:** Completed human-controlled production provider configuration and sanitized evidence reconciliation. Overall Step 3B verdict: **PASS**.

**Configuration dates:** Sentry production configuration and verification were completed on 2026-06-29. UptimeRobot configuration and verification were completed on 2026-06-30.

**Exact deployed production commit:** `a272b760d97258ceb6eb3edef8852b5dcf005bd9`.

## Objective

Document the completed human-controlled Sentry and UptimeRobot production configuration for the Job Fit & Skill-Gap Analyzer without adding or exposing provider credentials, changing runtime code, changing packages, changing workflows, changing database schema/RLS, changing Clerk/Supabase, changing provider settings, or configuring a custom domain.

Step 3B proves the minimum production observability provider setup can receive only the approved sanitized server-side failure events and independent uptime notifications while preserving the Version 24 privacy boundaries.

## Sanitized configuration scope

This document records only sanitized operational facts:

- provider names;
- safe organization/project/monitor names;
- public application URLs;
- environment-variable names without values;
- pass/fail verification results;
- synthetic failure-class names and safe expected Sentry messages;
- configuration dates;
- deployed commit SHA; and
- known limitations.

This document does **not** include Sentry DSNs, project client keys, auth tokens, environment-variable values, raw Sentry event JSON, screenshots, emails, passwords, recovery codes, Clerk IDs, Supabase identifiers, actual résumé/job text, provider account IDs, or UptimeRobot API keys.

## Two-project Sentry architecture

Sentry is configured as two separate server-side production error-monitoring projects:

| Service boundary | Sentry project | Purpose |
| --- | --- | --- |
| Next.js analysis proxy | `job-fit-analyzer-proxy` | Receives only eligible sanitized proxy failure message events from the server-side `/api/analyze` route. |
| FastAPI analysis service | `job-fit-analyzer-api` | Receives only eligible sanitized backend failure message events from the FastAPI service. |

The two-project split keeps proxy and backend failures independently grouped, alerted, and reviewed. It also avoids relying on browser monitoring, replay, tracing, profiling, source maps, external log aggregation, or a single mixed project for both runtime boundaries.

## Account, MFA, and data-region posture

- Sentry organization: `cooper-robillard`.
- Sentry data region: United States.
- MFA enabled: **YES**.
- Provider-side data scrubbing: **PASS**.
- IP storage disabled: **PASS**.

These are human-controlled provider settings. No provider account IDs or credentials are recorded in the repository.

## Provider-managed DSNs and kill switches

Production delivery uses provider-managed DSNs entered by the human in the hosting providers. DSNs are not committed, printed, or documented in this repository.

Approved environment-variable names, without values:

- `OBSERVABILITY_TELEMETRY_ENABLED`
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`
- `SENTRY_RELEASE`

The telemetry kill switch remains the required control point: telemetry initializes only when `OBSERVABILITY_TELEMETRY_ENABLED` is enabled and a server-side `SENTRY_DSN` is present in the relevant provider environment.

## Vercel and Render enablement sequence

Human enablement was completed against deployed commit `a272b760d97258ceb6eb3edef8852b5dcf005bd9`:

1. Configure both Sentry projects and privacy defenses.
2. Run the temporary branch-specific Vercel Preview proxy canary.
3. Run the local FastAPI synthetic exception against the real API Sentry project.
4. Configure production variables with telemetry disabled first.
5. Verify normal Vercel and Render behavior while disabled.
6. Enable Vercel production telemetry and redeploy.
7. Confirm a normal fictional analysis succeeds and creates no Sentry issue.
8. Enable Render production telemetry and deploy.
9. Confirm `/health` and a normal hosted analysis succeed.
10. Preserve the known limitation that the hosted Render exception path was not deliberately triggered.

Results:

- Branch-specific Preview proxy canary: **PASS**.
- Local FastAPI synthetic API event: **PASS**.
- Production variables configured with telemetry disabled first: **PASS**.
- Normal behavior while disabled: **PASS**.
- Vercel production telemetry enabled: **PASS**.
- Normal fictional analysis produced no Sentry issue: **PASS**.
- Render production telemetry enabled: **PASS**.
- `/health` and normal hosted analysis after Render enablement: **PASS**.

## Proxy canary procedure and result

The proxy redaction canary used a temporary branch-specific Vercel Preview deployment before production telemetry was enabled. No deliberate production proxy failure was triggered.

Procedure:

1. Create a temporary Vercel Preview deployment from a branch-specific configuration.
2. Enable telemetry and the proxy Sentry project only for that branch-specific Preview environment.
3. Trigger a fictional synthetic upstream-unreachable failure.
4. Confirm the event appears in the Sentry proxy project only as the sanitized message event.
5. Inspect the provider-side event view for forbidden sentinel strings and disallowed request/user/exception context.
6. Remove the temporary Preview configuration and branch after verification.
7. Enable production telemetry only after the canary passed.

Expected proxy message:

```text
nextjs_analysis_proxy:proxy.upstream_unreachable
```

Result:

- Proxy synthetic event: **PASS**.
- Proxy sentinels absent: **PASS**.
- Proxy request/user/exception context absent: **PASS**.

## FastAPI local synthetic exception procedure and result

The backend verification used the real Sentry API project, but the hosted Render backend failure path was not deliberately triggered. The hosted Render free web-service tier provides no shell/SSH access, and no unsafe debug endpoint was introduced.

Procedure:

1. Configure the Python adapter with the real Sentry API project in a controlled local verification context.
2. Trigger the approved local synthetic FastAPI exception path.
3. Confirm the event appears in the Sentry API project only as the sanitized message event.
4. Inspect the provider-side event view for forbidden sentinel strings and disallowed request/user/exception context.

Expected API message:

```text
fastapi_analysis_service:backend.unhandled_exception
```

Result:

- API synthetic event: **PASS**.
- API sentinels absent: **PASS**.
- API request/user/exception context absent: **PASS**.

## Raw-event redaction inspection

Provider inspection confirmed the Sentry events did not include raw résumé/job content, synthetic sentinel values, project client keys, tokens, passwords, emails, screenshots, raw request bodies, headers, cookies, query strings, user context, exception objects, stack locals, or raw event JSON in the repository.

The verified provider event shape remained limited to the Step 3A reconstructed safe message event model. Provider-side scrubbing and disabled IP storage are defense-in-depth controls, not substitutes for the SDK-side allowlist and reconstruction rules.

## Alert rules

Configured Sentry alert rules:

1. `Production proxy critical configuration failure`
2. `Production proxy new operational failure`
3. `Production API backend failure`

Sentry email notification test: **PASS**.

## UptimeRobot monitor configuration

Configured UptimeRobot monitors:

| Monitor | URL | Result |
| --- | --- | --- |
| `Job Fit Analyzer — Frontend` | `https://internship-fit-gap-analyzer.vercel.app/` | Frontend monitor healthy: **PASS** |
| `Job Fit Analyzer — Backend Health` | `https://internship-fit-gap-analyzer.onrender.com/health` | Backend monitor healthy: **PASS** |

These monitors provide independent external checks for the public frontend and Render `/health` endpoint. No UptimeRobot API key, provider account ID, or notification target is recorded in the repo.

## Uptime DOWN and UP notification test

A temporary UptimeRobot monitor was used only to verify notification delivery.

Results:

- Temporary DOWN alert test: **PASS**.
- Temporary UP alert test: **PASS**.
- Temporary monitor deleted: **PASS**.

## Rollback procedure

If telemetry or uptime monitoring behaves unsafely or causes operational confusion:

1. Disable `OBSERVABILITY_TELEMETRY_ENABLED` for the affected Vercel and/or Render production environment.
2. Redeploy/restart the affected service if the provider requires it for environment changes to take effect.
3. Confirm successful analysis still works without Sentry delivery.
4. Preserve sanitized incident notes without copying raw Sentry JSON, secrets, screenshots, emails, account IDs, Clerk IDs, Supabase identifiers, or résumé/job text into GitHub.
5. Delete an affected Sentry issue when sensitive content was ingested.
6. Consider recreating the affected Sentry project if exposure was widespread.
7. Rotate any actually exposed credential.
8. Pause or delete the affected Sentry alert rule if it is noisy or unsafe.
9. Pause a misconfigured UptimeRobot monitor rather than changing application behavior merely to satisfy it.

Rollback must not disable RLS, change database schema, expose service-role keys, add debug endpoints, or commit environment values.

## Known limitations

- The hosted Render backend failure path was not deliberately triggered because the free Render web-service tier provides no shell/SSH access and no unsafe debug endpoint was introduced.
- The Python adapter was verified against the real Sentry API project using a local synthetic FastAPI exception path.
- Step 3B proves provider configuration and redaction verification for the approved synthetic paths; it is not a formal security audit, penetration test, compliance review, or full incident-response exercise.
- Browser monitoring, session replay, tracing, profiling, source-map upload, external log aggregation, OpenTelemetry, status pages, AI-debugging, and custom-domain work remain deferred.
- Platform-managed logs and provider-managed metadata remain outside the application's SDK-side redaction guarantees.

## PASS verdict

Overall Step 3B verdict: **PASS**.

The human-controlled Sentry and UptimeRobot production configuration is documented as complete for the approved Version 24 Step 3B scope, with no DSN, token, provider credential, runtime code, dependency, workflow, database, RLS, Clerk, Supabase, or custom-domain change included in this reconciliation.

## Exact next step

Version 24 Step 4 — complete production observability verification and create the incident-response runbook.
