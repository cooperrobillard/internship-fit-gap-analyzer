# Version 24 Step 3A — disabled safe Sentry telemetry integration

**Status:** Code, dependency declarations, tests, CI updates, and documentation only. Telemetry remains disabled by default and no production provider delivery is configured.

## Objective

Add a minimal server-side-only Sentry adapter to the existing Version 24 Step 2 sanitized analysis event path without changing product UI, database schema, Clerk, Supabase, RLS, provider accounts, alerts, uptime monitors, production environment variables, or custom domains.

## Dependency versions

- Frontend/server: `@sentry/node` pinned to `10.42.0`.
- Python backend: `sentry-sdk==2.54.0`.

No `@sentry/nextjs`, browser SDK, React SDK, replay, tracing, profiling, OpenTelemetry, source-map, or logging package was added.

## Server-only architecture

- Next.js uses a Node-only adapter in `web/src/lib/observability/sentry-server.ts` and the analysis route declares `runtime = "nodejs"`.
- FastAPI uses `api/sentry_telemetry.py` with manual SDK calls only.
- Both adapters accept only an already-created, runtime-validated `SafeAnalysisEvent`.
- Request, response, error/exception, headers, cookies, identity/session, body, analysis payload, URL, query string, and raw upstream text objects are not adapter inputs.

## Why `@sentry/node` instead of `@sentry/nextjs`

The integration is intentionally limited to the server-side Next.js route handler. The Next.js Sentry SDK would normally add framework instrumentation, config files, source-map behavior, and client/server setup that are outside Step 3A. `@sentry/node` supports manual server-side message events without wizard output, browser monitoring, Edge setup, or automatic request instrumentation.

## Why automatic FastAPI integration is disabled

The backend adapter avoids `FastApiIntegration` and `StarletteIntegration` so Sentry cannot automatically capture request context, exceptions, locals, source context, or framework metadata. Only manually reconstructed safe failure message events are eligible.

## Kill-switch contract

Server-only future environment-variable names:

- `OBSERVABILITY_TELEMETRY_ENABLED`
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`
- `SENTRY_RELEASE`

Behavior:

1. Telemetry defaults to disabled.
2. `OBSERVABILITY_TELEMETRY_ENABLED` must normalize to `true`.
3. `SENTRY_DSN` must be present and nonblank.
4. If either requirement is missing, the SDK is not initialized.
5. `SENTRY_ENVIRONMENT` and `SENTRY_RELEASE` are optional and omitted when they fail the safe token rules.
6. No values are committed or logged.
7. `NEXT_PUBLIC_SENTRY_DSN` is not used.

## Strict outbound event mapping

Sentry receives only manually rebuilt message events for validated failure events:

- message: `<service>:<failure_class>`
- fingerprint: `[service, failure_class]`
- level: `warning`, `error`, or `fatal`
- tags: low-cardinality allowlisted fields only
- extra: exactly `extra.safe_event`

`request_id` and `event_id` are not Sentry tags. The request ID remains only inside `extra.safe_event`.

## Failure-only behavior

Successful analyses continue to emit native safe JSON logs but are never submitted to Sentry. Expected user-correctable outcomes such as 422 validation, 429 rate limiting, shared-secret 401, and `/health` are not submitted by FastAPI. Eligible proxy/backend failure classes are validated before capture.

## SDK configuration

JavaScript config disables default integrations, breadcrumbs, PII, stack traces, logs, client reports, and trace propagation. Python config disables default and auto integrations, request bodies, local variables, source context, breadcrumbs, stack traces, logs, sessions, client reports, and tracing.

## Redaction hook

Both `beforeSend` and `before_send` ignore incoming SDK scope data, validate `extra.safe_event`, require `outcome == "failure"`, and return a brand-new provider event. Unknown/malformed safe events are dropped.

## Sentinel tests

Tests use fictional sentinel values for resume, job, note, token, header, cookie, exception, identity, and URL content. The adapters verify these strings do not survive provider event reconstruction.

## Provider failure isolation

Initialization, capture, and flush failures are swallowed. Analysis responses, status codes, headers, and generic error bodies do not depend on telemetry status.

## Vercel serverless delivery (Step 3B canary follow-up)

Version 24 Step 3B preview verification showed that native sanitized JSON logging worked for eligible proxy failures, but no outbound Sentry request occurred from the Vercel Node.js serverless route. The likely causes were dynamic `createRequire` SDK loading that Next.js/Vercel bundling may not trace reliably, and missing bounded transport draining before the function returned.

The follow-up fix:

- statically imports `@sentry/node` for a traceable server bundle;
- still initializes only when `OBSERVABILITY_TELEMETRY_ENABLED=true` and `SENTRY_DSN` is nonblank;
- calls the public SDK `flush()` API with a 2000 ms bounded timeout after each eligible `captureEvent`;
- awaits that flush on eligible failure paths in the analysis route;
- swallows flush timeout, false results, and SDK errors through the existing adapter status contract.

All Step 3A privacy, redaction, kill-switch, and failure-isolation guarantees remain unchanged. Production telemetry remains disabled until the Step 3B canary is repeated successfully.

## Exact changed files

- `requirements.txt`
- `web/package.json`
- `web/src/app/api/analyze/route.ts`
- `web/src/app/api/analyze/route.test.ts`
- `web/src/lib/observability/safe-events.ts`
- `web/src/lib/observability/sentry-server.ts`
- `web/src/lib/observability/sentry-server.test.ts`
- `api/main.py`
- `api/observability.py`
- `api/sentry_telemetry.py`
- `tests/test_api_service.py`
- `tests/test_sentry_telemetry.py`
- `.github/workflows/ci.yml`
- `docs/VERSION_24_STEP_3A_SENTRY_INTEGRATION.md`
- `docs/VERSION_24_RELEASE_DIRECTION.md`
- `docs/LIMITATIONS.md`
- `LEARNING_LOG.md`

## Local and CI tests

CI now runs the new backend Sentry telemetry test, existing API service tests, `run_tests.py`, expanded Python compilation, focused frontend observability tests, and lint. Local dependency installation may require normal package registry access.

## Production behavior while disabled

With no committed environment values and no provider configuration, production behavior remains native safe JSON logging only. Sentry is not initialized unless the human later enables the kill switch and provides a server-only DSN.

## Known limitations

- No Sentry account, project, DSN, provider delivery, dashboard, alert, or production redaction verification exists from this PR.
- No UptimeRobot monitor exists from this PR.
- No browser monitoring, replay, tracing, profiling, or source maps are configured.
- Provider-managed platform logs remain outside application-level redaction guarantees.

## Human configuration deferred to Step 3B

Humans must create and configure provider accounts, server-only environment variables, alerts, uptime monitors, and production verification. This PR intentionally does none of that.

## Exact next step

Version 24 Step 3B — create and configure the human-controlled Sentry and UptimeRobot accounts, enable server-side production delivery carefully, configure minimum alerts, and verify redaction using synthetic sentinel failures.
