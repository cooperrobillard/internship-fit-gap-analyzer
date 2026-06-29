# Version 24 Step 2 — request correlation and safe events

**Status:** Implemented in code and covered by focused local tests. No production provider delivery has been enabled or verified.

## Objective

Version 24 Step 2 adds vendor-neutral request correlation, safe `X-Request-ID` propagation, stable failure classification, and centralized allowlist-only event models for the analysis path without installing or contacting an observability provider.

## Final request path

```text
Browser
→ Clerk-protected Next.js POST /api/analyze
→ Render FastAPI POST /analyze
→ deterministic rule-based analyzer
→ structured response
→ optional browser-to-Supabase structured persistence under existing RLS
```

The architecture is unchanged. Request IDs are not stored in Supabase, SQLite, browser storage, cookies, saved-analysis records, or application records.

## Vercel trust boundary

The Next.js route is the trusted application boundary for analysis request IDs. For every application-handled `POST /api/analyze`, the route generates a fresh lowercase UUIDv4 and ignores any browser-supplied `X-Request-ID`. That ID is forwarded to FastAPI and attached to all responses the route controls, including success, safe parse/read errors, size errors, forwarded validation errors, missing backend configuration, malformed/auth/unexpected upstream responses, upstream 5xx responses, upstream unavailability, and timeouts.

Clerk/platform/WAF responses generated before application route control may not include the application header.

## Render validation behavior

FastAPI accepts an incoming `X-Request-ID` only when it is a canonical lowercase UUIDv4. Missing, malformed, oversized, uppercase/noncanonical, or non-v4 values are replaced with a fresh UUIDv4. The resolved ID is stored on `request.state.request_id` and attached to all FastAPI responses, including `/health`, validation 422 responses, shared-secret 401 responses, successful `/analyze` responses, and generic unexpected-exception 500 responses.

The request ID is never used for authentication, authorization, RLS, persistence, saved records, or user identity.

## `X-Request-ID` contract

- Header name: `X-Request-ID`.
- Format: canonical lowercase UUIDv4.
- Next.js generates one fresh ID per application-handled analysis request.
- Browser-supplied IDs are ignored by Next.js.
- FastAPI validates the forwarded ID and safely falls back when invalid.
- The same ID appears in the Vercel and Render success events for a successful analysis.
- Platform-generated responses may not include the header.

## Stable failure taxonomy

Step 2 defines the complete Version 24 failure-class set in both the TypeScript and Python safe-event modules. Emitted Step 2 classes are limited to:

- `config.backend_url_missing`
- `config.shared_secret_rejected`
- `proxy.upstream_timeout`
- `proxy.upstream_unreachable`
- `proxy.upstream_invalid_response`
- `proxy.upstream_5xx`
- `backend.unhandled_exception`

The full stable set also includes request, auth, data, availability, deployment, observability, privacy, and security classes for later steps.

## Safe event contract

Centralized allowlist-only event modules now exist in:

- `web/src/lib/observability/safe-events.ts`
- `api/observability.py`

Allowed fields are restricted to the Version 24 schema: schema and event IDs, request ID, timestamp, service, operation, outcome, severity, environment/release/runtime fields, fixed route template, HTTP method/status, duration, failure class, upstream status class, retry count, rate-limit result, and coarse payload-size bucket. Unknown fields are not serialized.

Core analysis events use:

- `schema_version: "1"`
- `event_name: "analysis_request"`
- `operation: "analyze"`
- `service: "nextjs_analysis_proxy"` or `"fastapi_analysis_service"`
- fixed route templates `/api/analyze` and `/analyze`

Success events omit `failure_class`. Failure events require a recognized `failure_class`.

## Success-event behavior

A successful analysis emits one sanitized JSON event from Next.js and one sanitized JSON event from FastAPI. Both use the same request ID. Neither event logs the analysis response, matched skills, missing skills, categories, summary text, job metadata, user identity, headers, cookies, bodies, or URLs.

## Failure-event behavior

Next.js emits sanitized application failure events for missing backend URL, upstream shared-secret rejection, timeout, network/connectivity failure, malformed/unparsable upstream response, Render 5xx, and unexpected non-422 upstream contract violations.

FastAPI emits `backend.unhandled_exception` only for unexpected `/analyze` exceptions and returns the existing generic 500 response body exactly:

```json
{"detail":"The analysis could not be completed. Please try again."}
```

Validation 422 and direct shared-secret 401 responses include safe request IDs but do not emit structured backend failure events in this step.

## Expected outcomes not emitted

This step intentionally does not emit structured application failure events for routine expected outcomes such as request read/JSON failure, 413 request too large, FastAPI 422 validation, rate limiting, user cancellation, or unavailable saved records.

## Native server-log behavior

- Next.js writes one serialized sanitized JSON line to `process.stderr` for emitted events.
- FastAPI uses the existing server logger to write one serialized sanitized JSON event.
- Emission is best-effort and swallowed on failure.
- No browser/client event emission was added.
- No HTTP request is sent to a telemetry service.

## Privacy invariants

Events never intentionally include raw résumé text, raw job-description text, uploaded file contents, request or response bodies, parsed JSON payloads, matched/missing skills, categories, summary text, job title, company, notes, source URL, profile fields, names, emails, Clerk IDs, session IDs, Supabase row IDs, analysis IDs, IP addresses, user agents, cookies, authorization headers, `X-Analysis-Api-Key`, tokens, secrets, environment-variable values, full URLs, query strings, browser storage, DOM text, console output, breadcrumbs, stack locals, screenshots, attachments, or exception messages.

Synthetic sentinel tests verify sensitive strings do not enter serialized safe events or captured FastAPI logs.

## Exact changed files

- `web/src/app/api/analyze/route.ts`
- `web/src/lib/observability/safe-events.ts`
- `web/src/lib/observability/safe-events.test.ts`
- `api/main.py`
- `api/observability.py`
- `tests/test_api_service.py`
- `docs/VERSION_24_STEP_2_REQUEST_CORRELATION.md`
- `docs/VERSION_24_RELEASE_DIRECTION.md`
- `docs/LIMITATIONS.md`
- `LEARNING_LOG.md`

## Tests

Focused tests cover UUID generation/validation, non-deterministic IDs, event ID generation, success/failure event invariants, allowlisted keys, extra-field rejection, sentinel redaction, optional-value omission, safe duration/status handling, emission failure safety, coarse payload buckets, stable failure mappings, FastAPI response headers, propagated and replaced request IDs, safe 422/401 headers, generic 500 behavior, safe backend failure events, and existing API/CORS/no-persistence behavior.

## Production verification procedure

Human production verification still needs to:

1. Send an authenticated analysis through the hosted Next.js route.
2. Confirm the `X-Request-ID` response header is a canonical lowercase UUIDv4.
3. Confirm the Render `/analyze` log event for the same request uses the same request ID.
4. Confirm native logs show only allowlisted event fields.
5. Run sentinel inputs and confirm no sentinel résumé, job, note, token, secret, body, header, URL, or exception-message content appears in application-emitted events.
6. Confirm platform/Clerk/WAF-generated responses are understood as outside the application-header guarantee.

## Known limitations

- Platform/Clerk/WAF-generated responses may not contain the application request ID.
- Request IDs are transient and are not stored with users or analyses.
- Direct browser-to-Supabase operations are not part of this request-correlation path.
- No third-party provider receives events.
- Native server logs now contain only the explicitly sanitized event model for these events.
- No alerting threshold exists yet.
- Production log retention remains provider-controlled.
- No browser error monitoring exists.
- No session replay, tracing, or profiling exists.

## No provider integration

This step does not add an SDK, provider DSN, exporter, OpenTelemetry, Sentry, UptimeRobot, analytics, alert, log drain, environment variable, provider account, database change, RLS change, Clerk change, Supabase change, Render setting, Vercel setting, or custom-domain change.

## Exact next step

Version 24 Step 3A — integrate minimum server-side Sentry telemetry behind a disabled-by-default kill switch and strict SDK-side redaction, without enabling production provider delivery.
